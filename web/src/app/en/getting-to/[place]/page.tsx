import { notFound } from 'next/navigation';
import { PlacePage } from '@/components/guides/PlacePage';
import { placeMetadata } from '@/lib/guides/meta';
import { GUIDE_PLACES, placeBySlug } from '@/lib/guides/places';

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_PLACES.map((p) => ({ place: p.slug.en }));
}

export async function generateMetadata({ params }: { params: Promise<{ place: string }> }) {
  const place = placeBySlug('en', (await params).place);
  return place ? placeMetadata(place, 'en') : {};
}

export default async function Page({ params }: { params: Promise<{ place: string }> }) {
  const place = placeBySlug('en', (await params).place);
  if (!place) notFound();
  return <PlacePage lang="en" place={place} />;
}
