# Future Life Launchpad website

Next.js static export for Future Life Launchpad (English, Sinhala, Tamil), hosted on Cloudflare Pages at
https://launchpad.fli.lk. Every merge to `main` builds and deploys through GitHub Actions.

- `content/*.html` – page markup (nav, home, apply, mentors, ecosystem, footer)
- `content/i18n.json` – Sinhala / Tamil translations
- `app/globals.css` – styles (Tailwind); `public/fonts` – Nunito; `public/img` – images and videos
- `components/Enhancer.tsx` – nav, scroll reveal, language switcher
- `components/ApplyForm.tsx` – apply form validation, Turnstile, submission
- `functions/api/inquiry.ts` – the only server code: receives applications and sends the emails

```
npm install
npm run dev     # local dev (pages only; /api/inquiry is not served)
npm run build   # static site written to ./out
```

## Inquiry emails

`POST /api/inquiry` checks the application and the Turnstile token, emails it to the Launchpad mailbox
(Reply-To is the applicant when they gave an email), then sends the applicant an automatic reply in their
language if they gave an email. Emails go through Resend from the verified domain `launchpad.fli.lk`.

Settings:

| Name | Kind | Where |
|---|---|---|
| `TO_EMAIL`, `FROM_EMAIL` | plain | `wrangler.jsonc` |
| `RESEND_API_KEY` | secret | Pages project → Settings → Variables and Secrets |
| `TURNSTILE_SECRET_KEY` | secret | Pages project → Settings → Variables and Secrets |
| `TURNSTILE_SITE_KEY` | public | GitHub repo → Settings → Secrets and variables → Actions → **Variables** |

Never commit keys. To run the function locally, copy `dev.vars.example` to `.dev.vars` (git-ignored), then:

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build
npx wrangler pages dev out
```
