'use client';

import { useEffect, useRef } from 'react';

/**
 * Comportamento minimo da finestra modale: chiusura con Escape, focus iniziale sul pannello
 * e ripristino del focus all'elemento che aveva aperto la modale.
 * Restituisce il ref da assegnare al contenitore con role="dialog".
 */
export function useDialogA11y<T extends HTMLElement = HTMLDivElement>(isOpen: boolean, onClose: () => void) {
  const panelRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return panelRef;
}
