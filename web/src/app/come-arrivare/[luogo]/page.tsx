import { notFound } from 'next/navigation';
import { PlacePage } from '@/components/guides/PlacePage';
import { placeMetadata } from '@/lib/guides/meta';
import { GUIDE_PLACES, placeBySlug } from '@/lib/guides/places';

// Percorsi ricalcolati una volta al giorno sull'orario del prossimo giorno feriale
export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_PLACES.map((p) => ({ luogo: p.slug.it }));
}

export async function generateMetadata({ params }: { params: Promise<{ luogo: string }> }) {
  const place = placeBySlug('it', (await params).luogo);
  return place ? placeMetadata(place, 'it') : {};
}

export default async function Page({ params }: { params: Promise<{ luogo: string }> }) {
  const place = placeBySlug('it', (await params).luogo);
  if (!place) notFound();
  return <PlacePage lang="it" place={place} />;
}
