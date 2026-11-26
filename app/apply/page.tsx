import type { Metadata } from 'next';
import ApplyForm from '@/components/ApplyForm';
import Enhancer from '@/components/Enhancer';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import { readContent } from '@/lib/content';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Apply free | Future Life Launchpad',
  description:
    'Apply for the free, mentor-led 8-week Future Life Launchpad programme. Two minutes, in your language.',
  path: '/apply/',
});

export default function ApplyPage() {
  return (
    <>
      <Nav solid />
      <div dangerouslySetInnerHTML={{ __html: readContent('apply') }} />
      <Footer />
      <Enhancer />
      <ApplyForm />
    </>
  );
}
