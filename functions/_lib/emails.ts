import type { Lang } from '../../lib/inquiry';

export interface Application {
  name: string;
  phone: string; // +94XXXXXXXXX
  whatsapp: string; // +94XXXXXXXXX
  email: string | null;
  district: string;
  businessType: string;
  ageRange: string;
  lang: Lang;
}

export interface Mail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
}

const NAVY = '#2B388F';
const ORANGE = '#F9A61A';
const INK = '#1b2140';
const MUTE = '#5b6180';
const LINE = '#e3e7f3';

/** Escape text for safe use inside HTML (applicant input is never trusted). */
export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** One line only: strips anything that could break a subject line. */
const oneLine = (s: string): string =>
  Array.from(s, (ch) => {
    const code = ch.charCodeAt(0);
    return code < 32 || code === 127 || code === 0x2028 || code === 0x2029 ? ' ' : ch;
  })
    .join('')
    .replace(/ {2,}/g, ' ')
    .trim();

const AGE_LABEL: Record<string, string> = { '55+': '55+' };
const ageLabel = (a: string) => AGE_LABEL[a] ?? a.replace('-', '–');

const LANG_NAME: Record<Lang, string> = { en: 'English', si: 'Sinhala', ta: 'Tamil' };

/** Email to the Launchpad team (always sent). */
export function staffEmail(a: Application, from: string, to: string): Mail {
  const wa = `https://wa.me/${a.whatsapp.replace('+', '')}`;
  const rows: Array<[string, string, string]> = [
    ['Name', esc(a.name), a.name],
    ['Phone', `<a href="tel:${esc(a.phone)}" style="color:${NAVY}">${esc(a.phone)}</a>`, a.phone],
    ['WhatsApp', `<a href="${esc(wa)}" style="color:${NAVY}">${esc(a.whatsapp)}</a> (open chat)`, `${a.whatsapp}  ${wa}`],
    [
      'Email',
      a.email ? `<a href="mailto:${esc(a.email)}" style="color:${NAVY}">${esc(a.email)}</a>` : '<em>not given</em>',
      a.email ?? 'not given',
    ],
    ['District', esc(a.district), a.district],
    ['Business type', esc(a.businessType), a.businessType],
    ['Age range', esc(ageLabel(a.ageRange)), ageLabel(a.ageRange)],
    ['Language', LANG_NAME[a.lang], LANG_NAME[a.lang]],
  ];

  const how = a.email
    ? 'Reply to this email to answer the applicant directly, or call or message them on WhatsApp.'
    : 'No email was given, so contact the applicant by phone or WhatsApp.';

  const html = `<!doctype html><html><body style="margin:0;background:#f4f6fc;font-family:Arial,Helvetica,sans-serif;color:${INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fc;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:16px">
<tr><td style="padding:22px 26px;border-bottom:4px solid ${ORANGE}"><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${MUTE};font-weight:bold">Future Life Launchpad</div>
<div style="font-size:22px;font-weight:bold;color:${NAVY};margin-top:4px">New application</div></td></tr>
<tr><td style="padding:8px 26px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid ${LINE};color:${MUTE};font-size:14px;width:120px;vertical-align:top">${k}</td><td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:15px;font-weight:bold">${v}</td></tr>`,
  )
  .join('\n')}
</table></td></tr>
<tr><td style="padding:16px 26px 24px;color:${MUTE};font-size:14px;line-height:1.5">${esc(how)}</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    'New Launchpad application',
    '',
    ...rows.map(([k, , plain]) => `${k}: ${plain}`),
    '',
    how,
  ].join('\n');

  return {
    from,
    to,
    subject: oneLine(`New application: ${a.name} · ${a.district} · ${a.businessType}`),
    html,
    text,
    ...(a.email ? { reply_to: a.email } : {}),
  };
}

interface ReplyCopy {
  subject: string;
  hello: (name: string) => string;
  lines: string[];
  sign: string;
  tagline: string;
}

// Sinhala and Tamil are drafts: have a native speaker review them before relying on them.
const REPLY: Record<Lang, ReplyCopy> = {
  en: {
    subject: 'We received your Launchpad application',
    hello: (n) => `Hi ${n},`,
    lines: [
      'Thank you for applying to Future Life Launchpad. We have received your application.',
      'Our team will contact you soon by phone or WhatsApp.',
      'This is an automatic message from an address that does not accept emails. If you want to add anything, write to us at {contact}.',
    ],
    sign: 'Future Life Launchpad',
    tagline: 'Empowering People · Building Futures',
  },
  si: {
    subject: 'ඔබේ Launchpad අයදුම්පත අපට ලැබුණා',
    hello: (n) => `ආයුබෝවන් ${n},`,
    lines: [
      'Future Life Launchpad සඳහා අයදුම් කළ ඔබට ස්තූතියි. ඔබේ අයදුම්පත අපට ලැබී ඇත.',
      'අපගේ කණ්ඩායම ඉක්මනින් දුරකථනයෙන් හෝ WhatsApp මගින් ඔබව සම්බන්ධ කරගනු ඇත.',
      'මෙය ඊමේල් පණිවිඩ භාර නොගන්නා ලිපිනයකින් එවූ ස්වයංක්‍රීය පණිවිඩයකි. යමක් එකතු කිරීමට අවශ්‍ය නම්, {contact} වෙත ලියන්න.',
    ],
    sign: 'Future Life Launchpad',
    tagline: 'ජනතාව සවිබල ගැන්වීම · අනාගතය ගොඩනැගීම',
  },
  ta: {
    subject: 'உங்கள் Launchpad விண்ணப்பம் எங்களுக்குக் கிடைத்தது',
    hello: (n) => `வணக்கம் ${n},`,
    lines: [
      'Future Life Launchpad-க்கு விண்ணப்பித்ததற்கு நன்றி. உங்கள் விண்ணப்பம் எங்களுக்குக் கிடைத்துள்ளது.',
      'எங்கள் குழு விரைவில் தொலைபேசி அல்லது WhatsApp மூலம் உங்களைத் தொடர்புகொள்ளும்.',
      'இது மின்னஞ்சல்களை ஏற்காத முகவரியிலிருந்து அனுப்பப்பட்ட தானியங்கி செய்தி. எதையாவது சேர்க்க விரும்பினால், {contact} என்ற முகவரிக்கு எழுதவும்.',
    ],
    sign: 'Future Life Launchpad',
    tagline: 'மக்களை வலுப்படுத்துதல் · எதிர்காலத்தைக் கட்டியெழுப்புதல்',
  },
};

/** Automatic reply to the applicant (only when they gave an email). Replies go to the Launchpad mailbox. */
export function autoReply(a: Application, from: string, replyTo: string): Mail | null {
  if (!a.email) return null;
  const base = REPLY[a.lang];
  // "{contact}" becomes the team mailbox (the bare address, without any display name)
  const contact = (/<([^>]+)>/.exec(replyTo)?.[1] ?? replyTo).trim();
  const c = { ...base, lines: base.lines.map((l) => l.replace('{contact}', contact)) };
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6fc;font-family:Arial,Helvetica,'Noto Sans Sinhala','Noto Sans Tamil',sans-serif;color:${INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fc;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:16px">
<tr><td style="padding:22px 26px;border-bottom:4px solid ${ORANGE};font-size:20px;font-weight:bold;color:${NAVY}">Future Life Launchpad</td></tr>
<tr><td style="padding:24px 26px 8px;font-size:16px;line-height:1.6">
<p style="margin:0 0 14px;font-weight:bold">${esc(c.hello(a.name))}</p>
${c.lines.map((l) => `<p style="margin:0 0 14px">${esc(l)}</p>`).join('\n')}
</td></tr>
<tr><td style="padding:8px 26px 26px;font-size:14px;color:${MUTE};line-height:1.5"><strong style="color:${NAVY}">${esc(c.sign)}</strong><br>${esc(c.tagline)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [c.hello(a.name), '', ...c.lines.flatMap((l) => [l, '']), c.sign, c.tagline].join('\n');
  return { from, to: a.email, subject: c.subject, html, text, reply_to: replyTo };
}
