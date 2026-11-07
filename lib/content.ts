import fs from 'node:fs';
import path from 'node:path';

/** Reads an HTML fragment from /content at render time (build time for the static export). */
export function readContent(name: string): string {
  return fs.readFileSync(path.join(process.cwd(), 'content', `${name}.html`), 'utf8');
}
