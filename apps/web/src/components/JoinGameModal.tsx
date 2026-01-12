import { useState } from 'react';
import { Modal, Input, Button } from './ui';
import { Users } from 'lucide-react';

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (name: string, code: string) => void;
}

export function JoinGameModal({ isOpen, onClose, onJoin }: JoinGameModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && code.trim()) {
      onJoin(name.trim(), code.trim());
      setName('');
      setCode('');
      onClose();
    }
  };

  const isValid = name.trim() && code.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Operation">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Commander Identification"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <Input
          label="Operation Code"
          placeholder="Enter game code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <Button
          type="submit"
          disabled={!isValid}
          className="w-full h-14 text-lg"
          leftIcon={<Users size={20} />}
          variant="secondary"
        >
          Join Operation
        </Button>
      </form>
    </Modal>
  );
}
