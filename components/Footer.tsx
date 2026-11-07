import { readContent } from '@/lib/content';

export default function Footer() {
  return <div dangerouslySetInnerHTML={{ __html: readContent('footer') }} />;
}
