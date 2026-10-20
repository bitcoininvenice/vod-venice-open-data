import { FaqPage } from '@/components/guides/InfoPages';
import { guideMetadata } from '@/lib/guides/meta';

export const metadata = guideMetadata('faq', 'en');

export default function Page() {
  return <FaqPage lang="en" />;
}
