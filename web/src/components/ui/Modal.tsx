'use client';

import React from 'react';
import { useDialogA11y } from './useDialogA11y';

const ALIGN = {
  center: 'items-center p-3 sm:p-4',
  /** in alto, per le finestre con campo di ricerca */
  top: 'items-start pt-12 sm:pt-20 px-3',
  /** foglio dal basso su mobile, centrata da desktop */
  sheet: 'items-end sm:items-center p-2 sm:p-4',
} as const;

interface ModalProps {
  onClose: () => void;
  /** nome accessibile: testo (`label`) o id del titolo (`labelledBy`) */
  label?: string;
  labelledBy?: string;
  align?: keyof typeof ALIGN;
  /** classi del pannello (dimensioni, fondo, bordo) */
  panelClassName: string;
  /** clic sul fondo oscurato chiude la finestra (predefinito) */
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
}

/**
 * Finestra modale a tutto schermo: fondo oscurato, chiusura con Escape, focus sul pannello
 * all'apertura e ritorno del focus a chi l'ha aperta. Da montare solo quando è aperta.
 * Per i dettagli dei punti della mappa si usa invece InfoPanel, che non blocca la mappa.
 */
export const Modal: React.FC<ModalProps> = ({ onClose, label, labelledBy, align = 'center', panelClassName, closeOnBackdrop = true, children }) => {
  const panelRef = useDialogA11y(true, onClose);
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center ${ALIGN[align]} bg-black/60 backdrop-blur-sm animate-in fade-in duration-150`}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`outline-none ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
