'use client';

import { useEffect } from 'react';
import { t } from '@/lib/i18n';
import { normalizePhone } from '@/lib/phone';
import { WHATSAPP_NUMBER } from '@/lib/site';

const MESSAGE = 'Hi Future Life Launchpad! Please WhatsApp me when the first intake opens in my district. My number: {number}';

/** "Notify me" box: opens WhatsApp with a ready-typed message to the Launchpad number. */
export default function NotifyForm() {
  useEffect(() => {
    const form = document.getElementById('notifyForm') as HTMLFormElement | null;
    if (!form) return;
    const input = form.querySelector<HTMLInputElement>('input')!;
    const msg = document.getElementById('notifyMsg')!;

    let key = '';
    let isError = false;
    const show = (k: string, error: boolean) => {
      key = k;
      isError = error;
      msg.textContent = k ? t(k) : '';
      msg.classList.toggle('bad', error);
      input.setAttribute('aria-invalid', String(error));
    };

    const onSubmit = (e: Event) => {
      e.preventDefault();
      const number = normalizePhone(input.value);
      if (!number) {
        show('Enter a valid WhatsApp number, like 077 123 4567.', true);
        input.focus();
        return;
      }
      const text = t(MESSAGE).replace('{number}', number);
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
      show('Opening WhatsApp. Just press Send.', false);
      // Opened from the click, so mobile browsers allow it; falls back to this tab if blocked
      const win = window.open(url, '_blank');
      if (win) win.opener = null;
      else window.location.href = url;
    };
    const onInput = () => {
      if (isError) show('', false);
    };
    const onLang = () => {
      if (key) msg.textContent = t(key);
    };

    form.addEventListener('submit', onSubmit);
    input.addEventListener('input', onInput);
    window.addEventListener('lp-lang', onLang);
    return () => {
      form.removeEventListener('submit', onSubmit);
      input.removeEventListener('input', onInput);
      window.removeEventListener('lp-lang', onLang);
    };
  }, []);

  return null;
}
