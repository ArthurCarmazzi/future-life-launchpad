import type { Metadata } from 'next';
import Enhancer from '@/components/Enhancer';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import { readContent } from '@/lib/content';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Founding mentors | Future Life Launchpad',
  description:
    'Meet the founding mentors of Future Life Launchpad: unpaid, vetted people who run things, recruited city by city.',
  path: '/mentors/',
});

export default function MentorsPage() {
  return (
    <>
      <Nav solid />
      <div dangerouslySetInnerHTML={{ __html: readContent('mentors') }} />
      <Footer />
      <Enhancer />
    </>
  );
}
