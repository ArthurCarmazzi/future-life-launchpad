# Future Life Launchpad website

Next.js static export (no server, no Workers) for Future Life Launchpad (English, Sinhala, Tamil).

- `content/*.html` – page markup (nav, home, mentors, footer)
- `content/i18n.json` – Sinhala / Tamil translations
- `app/globals.css` – styles; `public/fonts` – Nunito; `public/img` – images
- `components/Enhancer.tsx` – nav, scroll reveal, language switcher

```
npm install
npm run dev     # local dev
npm run build   # static site written to ./out
```
