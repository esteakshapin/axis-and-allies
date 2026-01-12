import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Star } from 'lucide-react';
import { Button } from './ui';
import { JoinGameModal } from './JoinGameModal';
import { CreateGameModal, GameSettings } from './CreateGameModal';

interface LandingPageProps {
  onJoinGame: (name: string, code: string) => void;
  onCreateGame: (name: string, settings: GameSettings) => void;
  error?: string | null;
}

export function LandingPage({ onJoinGame, onCreateGame, error }: LandingPageProps) {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-paper-dark">
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.15)_100%)] pointer-events-none" />

      {/* Decorative lines */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="1" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Main Card */}
        <div className="bg-paper-light border-4 border-ink shadow-[8px_8px_16px_rgba(0,0,0,0.25)] rotate-1 relative">
          {/* Top Secret Stamp */}
          <div className="absolute -top-5 -right-5 z-20 transform rotate-12">
            <div className="border-3 border-military-red text-military-red px-3 py-1.5 font-stencil font-bold text-base uppercase tracking-widest opacity-90">
              Top Secret
            </div>
          </div>

          {/* Header Section - Dark */}
          <div className="bg-ink p-6 pb-4 text-center">
            <div className="flex justify-center mb-3">
              <Star className="w-10 h-10 text-military-khaki" fill="currentColor" />
            </div>
            <h1 className="text-3xl md:text-4xl font-stencil font-bold uppercase tracking-wider mb-1 text-military-khaki leading-tight">
              Axis
              <br />
              &
              <br />
              Allies
            </h1>
            <p className="font-typewriter text-ink-faded text-xs tracking-[0.2em] mt-3">
              STRATEGIC COMMAND CENTER • 1942
            </p>
          </div>

          {/* Content Section */}
          <div className="p-8 bg-paper-light">
            <div className="space-y-4">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant="primary"
                size="lg"
                className="w-full"
                rightIcon={<FileText size={20} />}
              >
                Initiate New Campaign
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-ink/30 border-dashed" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-typewriter">
                  <span className="bg-paper-light px-2 text-ink-faded">OR</span>
                </div>
              </div>

              <Button
                onClick={() => setIsJoinModalOpen(true)}
                variant="secondary"
                size="lg"
                className="w-full"
                leftIcon={<Users size={20} />}
              >
                Join Existing Operation
              </Button>

              {error && (
                <div className="mt-4 p-3 bg-military-red/10 border-2 border-military-red text-military-red text-sm font-typewriter text-center">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-paper-aged px-4 py-2 text-center border-t border-ink/20">
            <p className="font-typewriter text-[10px] text-ink-faded tracking-[0.15em]">
              CLASSIFIED DOCUMENT • DO NOT DISTRIBUTE
            </p>
          </div>
        </div>
      </motion.div>

      <JoinGameModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={onJoinGame}
      />

      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={onCreateGame}
      />
    </div>
  );
}
