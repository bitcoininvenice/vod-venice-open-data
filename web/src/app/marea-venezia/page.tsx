import { TidePage } from '@/components/guides/TidePage';
import { guideMetadata } from '@/lib/guides/meta';

export const metadata = guideMetadata('tide', 'it');
// Misura e previsione nell'HTML, rigenerate al più ogni minuto, come la misura del Centro Maree
export const revalidate = 60;

export default function Page() {
  return <TidePage lang="it" />;
}
