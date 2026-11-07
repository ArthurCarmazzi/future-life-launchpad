'use client';

import { useEffect } from 'react';
import I18N from '@/content/i18n.json';

type Lang = 'en' | 'si' | 'ta';
const dict = I18N as Record<string, Partial<Record<Lang, string>>>;

const SEL =
  "nav ul a, nav .btn, .mnav a, .hero .tag, .hero h1, .hero .lead, .hero .cta a, .statbar small, .eyebrow, .h2, .lede, .dk b, .dk div>span, .step h3, .step p, .mission .val, .mission h4, .mission p, .pledge, .band h3, .band p, .feat b, .feat span, .unit h3, .unit p, .mentor .role, .mentor p, summary, details p, .mnav a, .final h2, .final p, .final small, .final button, .face span, .face p, .legend, .proof .cap, footer .note, .real-tag, .real, .town figcaption, .townlist span, footer .fam span, footer .wrap>div:nth-child(3), .vmeta h4, .vmeta p, .vwrap.ph span, .btn.play, .aform .field>label:not(.same), .aform .same span, .aform legend, .aform .hint, .aform .submit, .aform .consent, .aform option[value=\"\"], .final option[value=\"\"], .athanks h2, .athanks p, .athanks a";

const norm = (h: string) => h.replace(/\s+/g, ' ').trim();

/** Scroll-reveal, sticky-nav and EN/SI/TA language switching (ported from the original inline script). */
export default function Enhancer() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // Sticky nav
    const nav = document.getElementById('nav');
    let menuOpen = false;
    const onScroll = () => {
      if (nav && !nav.hasAttribute('data-solid')) nav.classList.toggle('solid', window.scrollY > 60 || menuOpen);
    };
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

    // Placeholders (form fields) are translated the same way, keyed by their English text
    const phEls = [...document.querySelectorAll<HTMLInputElement>('input[placeholder]')].map((e) => {
      e.dataset.ph = e.placeholder;
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
      phEls.forEach((e) => {
        const en = e.dataset.ph as string;
        e.placeholder = (l !== 'en' && dict[en]?.[l]) || en;
      });
      window.dispatchEvent(new CustomEvent('lp-lang', { detail: l }));
      document.querySelectorAll<HTMLElement>('.lang [data-lang]').forEach((b) => {
        const on = b.dataset.lang === l;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', String(on));
        if (on) {
          const label = document.querySelector('.lang-label');
          if (label) label.textContent = b.dataset.short || l.toUpperCase();
        }
      });
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

    // Mobile menu (hamburger)
    const burger = document.querySelector<HTMLElement>('.burger');
    const mnav = document.getElementById('mnav');
    const setMenu = (open: boolean) => {
      if (!burger || !mnav) return;
      menuOpen = open;
      mnav.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      onScroll();
    };
    if (burger && mnav) {
      const onBurger = () => setMenu(!menuOpen);
      const onDocClick = (e: MouseEvent) => {
        const t = e.target as Node;
        if (menuOpen && !mnav.contains(t) && !burger.contains(t)) setMenu(false);
      };
      const onLink = (e: Event) => {
        if ((e.target as HTMLElement).closest('a')) setMenu(false);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && menuOpen) setMenu(false);
      };
      const onResize = () => {
        if (window.innerWidth > 920 && menuOpen) setMenu(false);
      };
      burger.addEventListener('click', onBurger);
      mnav.addEventListener('click', onLink);
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKey);
      window.addEventListener('resize', onResize);
      cleanups.push(() => {
        burger.removeEventListener('click', onBurger);
        mnav.removeEventListener('click', onLink);
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
      });
    }

    // Language dropdown: shows only the selected language; opens a list on click
    const lang = document.querySelector<HTMLElement>('.lang');
    const cur = lang?.querySelector<HTMLElement>('.lang-cur');
    const menu = lang?.querySelector<HTMLElement>('.lang-menu');
    const setOpen = (open: boolean) => {
      if (!lang || !cur || !menu) return;
      lang.classList.toggle('open', open);
      cur.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
    };
    if (lang && cur && menu) {
      const toggle = () => setOpen(!lang.classList.contains('open'));
      cur.addEventListener('click', toggle);
      const outside = (e: MouseEvent) => {
        if (!lang.contains(e.target as Node)) setOpen(false);
      };
      const esc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
          cur.focus();
        }
      };
      document.addEventListener('click', outside);
      document.addEventListener('keydown', esc);
      cleanups.push(() => {
        cur.removeEventListener('click', toggle);
        document.removeEventListener('click', outside);
        document.removeEventListener('keydown', esc);
      });
    }
    document.querySelectorAll<HTMLElement>('.lang [data-lang]').forEach((b) => {
      const h = () => {
        setLang(b.dataset.lang as Lang);
        setOpen(false);
      };
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
