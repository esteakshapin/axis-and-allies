import { useState } from 'react';
import { Modal, Input, Button, Select } from './ui';
import { FileText } from 'lucide-react';

export interface GameSettings {
  timeLimit: number | null; // null = unlimited, otherwise minutes
}

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, settings: GameSettings) => void;
}

const TIME_LIMIT_OPTIONS = [
  { value: 'unlimited', label: 'Unlimited' },
  { value: '5', label: '5 Minutes' },
  { value: '10', label: '10 Minutes' },
  { value: '15', label: '15 Minutes' },
  { value: '30', label: '30 Minutes' },
];

export function CreateGameModal({ isOpen, onClose, onCreate }: CreateGameModalProps) {
  const [name, setName] = useState('');
  const [timeLimit, setTimeLimit] = useState('unlimited');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const settings: GameSettings = {
        timeLimit: timeLimit === 'unlimited' ? null : parseInt(timeLimit, 10),
      };
      onCreate(name.trim(), settings);
      setName('');
      setTimeLimit('unlimited');
      onClose();
    }
  };

  const isValid = name.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Campaign">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Commander Identification"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <Select
          label="Turn Time Limit"
          options={TIME_LIMIT_OPTIONS}
          value={timeLimit}
          onChange={setTimeLimit}
        />

        <div className="pt-2 border-t border-ink/20">
          <p className="text-xs font-typewriter text-ink/60 mb-4">
            More settings will be available in future updates.
          </p>
        </div>

        <Button
          type="submit"
          disabled={!isValid}
          className="w-full h-14 text-lg"
          rightIcon={<FileText size={20} />}
        >
          Begin Campaign
        </Button>
      </form>
    </Modal>
  );
}
