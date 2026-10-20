import { TidePage } from '@/components/guides/TidePage';
import { guideMetadata } from '@/lib/guides/meta';

export const metadata = guideMetadata('tide', 'en');
export const revalidate = 60;

export default function Page() {
  return <TidePage lang="en" />;
}
