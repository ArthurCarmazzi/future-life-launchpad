'use client';

import { useEffect } from 'react';
import { t } from '@/lib/i18n';
import { WHATSAPP_NUMBER } from '@/lib/site';

const MESSAGE = 'Hi Future Life Launchpad! Please WhatsApp me when the first intake opens in {district} district.';

/** "Notify me" box: opens WhatsApp with a ready-typed message (including the district) to the Launchpad number. */
export default function NotifyForm() {
  useEffect(() => {
    const form = document.getElementById('notifyForm') as HTMLFormElement | null;
    if (!form) return;
    const select = form.querySelector<HTMLSelectElement>('select')!;
    const msg = document.getElementById('notifyMsg')!;

    let key = '';
    let isError = false;
    const show = (k: string, error: boolean) => {
      key = k;
      isError = error;
      msg.textContent = k ? t(k) : '';
      msg.classList.toggle('bad', error);
      select.setAttribute('aria-invalid', String(error));
    };

    const onSubmit = (e: Event) => {
      e.preventDefault();
      if (!select.value) {
        show('Please choose your district.', true);
        select.focus();
        return;
      }
      const text = t(MESSAGE).replace('{district}', select.value);
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
      show('Opening WhatsApp. Just press Send.', false);
      // Opened from the click, so mobile browsers allow it; falls back to this tab if blocked
      const win = window.open(url, '_blank');
      if (win) win.opener = null;
      else window.location.href = url;
    };
    const onChange = () => {
      if (isError) show('', false);
    };
    const onLang = () => {
      if (key) msg.textContent = t(key);
    };

    form.addEventListener('submit', onSubmit);
    select.addEventListener('change', onChange);
    window.addEventListener('lp-lang', onLang);
    return () => {
      form.removeEventListener('submit', onSubmit);
      select.removeEventListener('change', onChange);
      window.removeEventListener('lp-lang', onLang);
    };
  }, []);

  return null;
}
