import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Content */}
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-paper-light border-4 border-ink shadow-[8px_8px_0px_0px_rgba(44,36,27,0.3)]">
              {/* Header */}
              {title && (
                <div className="bg-ink text-paper-light px-6 py-4 flex items-center justify-between">
                  <h2 className="font-stencil text-xl uppercase tracking-widest">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-paper-light/70 hover:text-paper-light transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              )}

              {/* Close button if no title */}
              {!title && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-ink/70 hover:text-ink transition-colors z-10"
                >
                  <X size={24} />
                </button>
              )}

              {/* Body */}
              <div className="p-6 bg-paper-light">{children}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
