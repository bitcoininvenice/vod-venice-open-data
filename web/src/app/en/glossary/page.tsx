import { GlossaryPage } from '@/components/guides/InfoPages';
import { guideMetadata } from '@/lib/guides/meta';

export const metadata = guideMetadata('glossary', 'en');

export default function Page() {
  return <GlossaryPage lang="en" />;
}
