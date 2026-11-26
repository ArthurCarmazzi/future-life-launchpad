import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE_URL, pageMeta } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMeta({
    title: 'Future Life Launchpad',
    description:
      'Free, mentor-led 8-week programme for Sri Lankans of every age who want to start or grow a business. Build it here.',
    path: '/',
  }),
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#2B388F' };

/**
 * Runs before the page paints.
 *  - html.js lets the scroll animations hide sections; html.reveal-all (after 6s) shows everything if the script
 *    never starts (Enhancer cancels the timer as soon as it runs), so the page can never stay blank.
 *  - A visitor who chose Sinhala or Tamil last time gets the page hidden until the translation has been applied,
 *    so they never see the English text flash first. A timer removes that flag too.
 */
const SAVED_LANGUAGE = `var d=document.documentElement;d.classList.add('js');window.__rt=setTimeout(function(){d.classList.add('reveal-all')},6000);try{var l=localStorage.getItem('lp_lang');if(l==='si'||l==='ta'){d.lang=l;d.setAttribute('data-i18n-pending','');setTimeout(function(){d.removeAttribute('data-i18n-pending')},2500)}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: SAVED_LANGUAGE }} />
      </head>
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before React hydrates; ignore those. */}
      <body
        className="bg-white font-nunito leading-[1.55] text-ink si:font-sinhala ta:font-tamil"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
