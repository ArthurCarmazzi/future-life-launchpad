import Enhancer from '@/components/Enhancer';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import { readContent } from '@/lib/content';

export default function Home() {
  return (
    <>
      <Nav />
      <div dangerouslySetInnerHTML={{ __html: readContent('home') }} />
      <Footer />
      <Enhancer />
    </>
  );
}
