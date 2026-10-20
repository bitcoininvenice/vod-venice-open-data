import { VaporettiPage } from '@/components/guides/VaporettiPage';
import { guideMetadata } from '@/lib/guides/meta';

export const metadata = guideMetadata('vaporetti', 'it');

export default function Page() {
  return <VaporettiPage lang="it" />;
}
