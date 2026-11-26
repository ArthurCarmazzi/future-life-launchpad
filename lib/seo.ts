import type { Metadata } from 'next';

export const SITE_URL = 'https://launchpad.fli.lk';
export const SITE_NAME = 'Future Life Launchpad';

const OG_IMAGE = {
  url: '/og.jpg',
  width: 1200,
  height: 630,
  alt: 'Future Life Launchpad: build your business here, at any age',
};

/** Title, description, canonical address and link-preview (WhatsApp / Facebook / X) data for one page. */
export function pageMeta({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      locale: 'en_LK',
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE.url] },
  };
}
