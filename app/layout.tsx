import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Future Life Launchpad',
  description:
    'Free, mentor-led 8-week programme for Sri Lankans of every age who want to start or grow a business. Build it here.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
