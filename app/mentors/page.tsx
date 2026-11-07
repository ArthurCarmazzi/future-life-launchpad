import type { Metadata } from 'next';
import Enhancer from '@/components/Enhancer';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import { readContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Founding mentors | Future Life Launchpad',
  description:
    'Meet the founding mentors of Future Life Launchpad: unpaid, vetted people who run things, recruited city by city.',
};

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
