import { GlossaryPage } from '@/components/guides/InfoPages';
import { guideMetadata } from '@/lib/guides/meta';

export const metadata = guideMetadata('glossary', 'it');

export default function Page() {
  return <GlossaryPage lang="it" />;
}
