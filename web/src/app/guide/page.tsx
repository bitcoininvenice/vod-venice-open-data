import { GuidesHubPage } from '@/components/guides/InfoPages';
import { guideMetadata } from '@/lib/guides/meta';

export const metadata = guideMetadata('hub', 'it');

export default function Page() {
  return <GuidesHubPage lang="it" />;
}
