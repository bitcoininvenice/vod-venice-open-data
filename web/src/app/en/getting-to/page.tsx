import { GettingToHubPage } from '@/components/guides/InfoPages';
import { guideMetadata } from '@/lib/guides/meta';

export const metadata = guideMetadata('gettingTo', 'en');

export default function Page() {
  return <GettingToHubPage lang="en" />;
}
