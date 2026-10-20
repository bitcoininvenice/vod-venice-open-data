import { permanentRedirect } from 'next/navigation';

// /en non ha una pagina propria: le guide inglesi partono dall'elenco
export default function Page() {
  permanentRedirect('/en/guides');
}
