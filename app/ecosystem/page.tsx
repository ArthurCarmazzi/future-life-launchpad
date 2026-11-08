import type { Metadata } from 'next';
import Enhancer from '@/components/Enhancer';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import { readContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'The Future Life ecosystem | Future Life Launchpad',
  description:
    'One brand, nine ways to back you. The Future Life group of companies that stand behind Launchpad graduates.',
};

export default function EcosystemPage() {
  return (
    <>
      <Nav solid />
      <div dangerouslySetInnerHTML={{ __html: readContent('ecosystem') }} />
      <Footer />
      <Enhancer />
    </>
  );
}
