import fs from 'node:fs';
import path from 'node:path';
import Enhancer from '@/components/Enhancer';

// The page markup lives in content/body.html (unchanged from the original site).
// It is read once at build time, so the exported page is fully static.
const html = fs.readFileSync(path.join(process.cwd(), 'content', 'body.html'), 'utf8');

export default function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <Enhancer />
    </>
  );
}
