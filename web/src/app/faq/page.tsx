import { FaqPage } from '@/components/guides/InfoPages';
import { guideMetadata } from '@/lib/guides/meta';

export const metadata = guideMetadata('faq', 'it');

export default function Page() {
  return <FaqPage lang="it" />;
}
