import { VaporettiPage } from '@/components/guides/VaporettiPage';
import { guideMetadata } from '@/lib/guides/meta';

export const metadata = guideMetadata('vaporetti', 'en');

export default function Page() {
  return <VaporettiPage lang="en" />;
}
