import { readContent } from '@/lib/content';

/** Site nav. `solid` keeps it white from the start (pages without a hero image). */
export default function Nav({ solid = false }: { solid?: boolean }) {
  let html = readContent('nav');
  if (solid) html = html.replace('<nav id="nav"', '<nav id="nav" class="solid" data-solid');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
