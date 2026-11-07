import fs from 'node:fs';
import path from 'node:path';
import Enhancer from '@/components/Enhancer';

// The page markup lives in content/body.html (unchanged from the original site).
// It is read at render time, so edits show up immediately in dev, and the
// exported build is still fully static.
export default function Home() {
  const html = fs.readFileSync(path.join(process.cwd(), 'content', 'body.html'), 'utf8');
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <Enhancer />
    </>
  );
}
