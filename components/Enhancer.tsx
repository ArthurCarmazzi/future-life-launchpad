'use client';

import { useEffect } from 'react';
import I18N from '@/content/i18n.json';

type Lang = 'en' | 'si' | 'ta';
const dict = I18N as Record<string, Partial<Record<Lang, string>>>;

const SEL =
  "nav ul a, nav .btn, .hero .tag, .hero h1, .hero .lead, .hero .cta a, .statbar small, .eyebrow, .h2, .lede, .dk b, .dk div>span, .step h3, .step p, .mission .val, .mission h4, .mission p, .pledge, .band h3, .band p, .feat b, .feat span, .unit h3, .unit p, .mentor .role, .mentor p, summary, details p, .final h2, .final p, .final small, .final button, .face span, .face p, .legend, .proof .cap, footer .note, .real-tag, .real, .town figcaption, .townlist span, footer .fam span, footer .wrap>div:nth-child(3), .vmeta h4, .vmeta p, .vwrap.ph span, .btn.play";

const norm = (h: string) => h.replace(/\s+/g, ' ').trim();

/** Scroll-reveal, sticky-nav and EN/SI/TA language switching (ported from the original inline script). */
export default function Enhancer() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // Sticky nav
    const nav = document.getElementById('nav');
    const onScroll = () => nav?.classList.toggle('solid', window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onScroll));

    // Reveal on scroll
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    // Language switching
    const els = [...document.querySelectorAll<HTMLElement>(SEL)].map((e) => {
      e.dataset.en = norm(e.innerHTML);
      return e;
    });

    const syncSubs = (l: string) =>
      document.querySelectorAll('video').forEach((v) =>
        [...v.textTracks].forEach((t) => (t.mode = t.language === l ? 'showing' : 'disabled')),
      );

    const setLang = (l: Lang) => {
      document.documentElement.lang = l;
      els.forEach((e) => {
        const en = e.dataset.en as string;
        const t = dict[en];
        e.innerHTML = l === 'en' || !t ? en : t[l] || en;
      });
      document
        .querySelectorAll<HTMLElement>('.lang button')
        .forEach((b) => b.classList.toggle('on', b.dataset.lang === l));
      syncSubs(l);
      try {
        localStorage.setItem('lp_lang', l);
      } catch {}
    };

    document.querySelectorAll('video').forEach((v) => {
      const h = () => syncSubs(document.documentElement.lang || 'en');
      v.addEventListener('loadedmetadata', h);
      cleanups.push(() => v.removeEventListener('loadedmetadata', h));
    });

    const ph = document.getElementById('playHero');
    if (ph) {
      const h = (e: Event) => {
        e.preventDefault();
        document.getElementById('voices')?.scrollIntoView({ behavior: 'smooth' });
        const v = document.getElementById('vNimal') as HTMLVideoElement | null;
        setTimeout(() => {
          try {
            v?.play();
          } catch {}
        }, 700);
      };
      ph.addEventListener('click', h);
      cleanups.push(() => ph.removeEventListener('click', h));
    }

    document.querySelectorAll<HTMLElement>('.lang button').forEach((b) => {
      const h = () => setLang(b.dataset.lang as Lang);
      b.addEventListener('click', h);
      cleanups.push(() => b.removeEventListener('click', h));
    });

    let saved = 'en';
    try {
      saved = localStorage.getItem('lp_lang') || 'en';
    } catch {}
    if (saved !== 'en') setLang(saved as Lang);

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
