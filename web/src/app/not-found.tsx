'use client';

import dynamic from 'next/dynamic';

// Il contenuto (con il dizionario delle traduzioni) si scarica solo quando la pagina non esiste davvero:
// il confine not-found viene caricato da ogni pagina e non deve trascinarsi dietro tutto l'i18n.
const NotFoundContent = dynamic(() => import('@/components/site/NotFoundContent'));

export default function NotFound() {
  return <NotFoundContent />;
}
