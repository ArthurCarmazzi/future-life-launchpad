'use client';

import { useEffect } from 'react';
import { t } from '@/lib/i18n';
import { normalizePhone } from '@/lib/phone';

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,79}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validation + submission for the inquiry form on /apply. */
export default function ApplyForm() {
  useEffect(() => {
    const form = document.getElementById('applyForm') as HTMLFormElement | null;
    if (!form) return;

    const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
    const name = $<HTMLInputElement>('f-name');
    const phone = $<HTMLInputElement>('f-phone');
    const wa = $<HTMLInputElement>('f-whatsapp');
    const same = $<HTMLInputElement>('f-same');
    const email = $<HTMLInputElement>('f-email');
    const district = $<HTMLSelectElement>('f-district');
    const business = $<HTMLSelectElement>('f-business');
    const submit = $<HTMLButtonElement>('applySubmit');
    const status = $<HTMLElement>('applyStatus');
    const thanks = $<HTMLElement>('applyThanks');
    const ageInputs = [...form.querySelectorAll<HTMLInputElement>('input[name="age"]')];
    const honeypot = form.querySelector<HTMLInputElement>('input[name="website"]');

    const focusTargets: Record<string, HTMLElement> = {
      name,
      phone,
      whatsapp: wa,
      email,
      district,
      business,
      age: ageInputs[0],
    };

    // Errors are stored by their English key so they can be re-translated on language change
    const keys: Record<string, string> = {};
    const showError = (field: string, key: string | null) => {
      const box = form.querySelector<HTMLElement>(`[data-field="${field}"]`);
      const out = $<HTMLElement>(`e-${field}`);
      if (key) keys[field] = key;
      else delete keys[field];
      out.textContent = key ? t(key) : '';
      box?.classList.toggle('invalid', Boolean(key));
      box?.querySelector('input,select')?.setAttribute('aria-invalid', String(Boolean(key)));
    };

    const check: Record<string, () => string | null> = {
      name: () => (NAME_RE.test(name.value.trim()) ? null : 'Please enter your full name.'),
      phone: () => (normalizePhone(phone.value) ? null : 'Enter a valid Sri Lankan phone number, like 077 123 4567.'),
      whatsapp: () => (normalizePhone(wa.value) ? null : 'Enter a valid WhatsApp number, like 077 123 4567.'),
      email: () => (EMAIL_RE.test(email.value.trim()) ? null : 'Enter a valid Gmail address, like name@gmail.com.'),
      district: () => (district.value ? null : 'Please choose your district.'),
      business: () => (business.value ? null : 'Please choose your business type.'),
      age: () => (ageInputs.some((i) => i.checked) ? null : 'Please choose your age range.'),
    };
    const fields = Object.keys(check);

    const cleanups: Array<() => void> = [];
    const on = (el: EventTarget, ev: string, fn: EventListener) => {
      el.addEventListener(ev, fn);
      cleanups.push(() => el.removeEventListener(ev, fn));
    };

    // Validate when leaving a field; once an error is showing, re-check as the user types
    const wire = (field: string, els: HTMLElement[]) =>
      els.forEach((el) => {
        on(el, 'blur', () => {
          if ((el as HTMLInputElement).value !== '' || keys[field]) showError(field, check[field]());
        });
        const live = el.tagName === 'SELECT' || (el as HTMLInputElement).type === 'radio' ? 'change' : 'input';
        on(el, live, () => {
          if (keys[field]) showError(field, check[field]());
        });
      });
    wire('name', [name]);
    wire('phone', [phone]);
    wire('whatsapp', [wa]);
    wire('email', [email]);
    wire('district', [district]);
    wire('business', [business]);
    wire('age', ageInputs);

    // "Same as phone number"
    const syncSame = () => {
      if (same.checked) {
        wa.value = phone.value;
        wa.readOnly = true;
        if (keys.whatsapp) showError('whatsapp', check.whatsapp());
      } else {
        wa.readOnly = false;
      }
    };
    on(same, 'change', syncSame);
    on(phone, 'input', () => {
      if (same.checked) syncSame();
    });

    const setStatus = (key: string | null) => {
      status.dataset.k = key ?? '';
      status.textContent = key ? t(key) : '';
    };

    on(window, 'lp-lang', () => {
      Object.entries(keys).forEach(([field, key]) => {
        $<HTMLElement>(`e-${field}`).textContent = t(key);
      });
      if (status.dataset.k) status.textContent = t(status.dataset.k);
    });

    on(form, 'submit', async (e) => {
      e.preventDefault();
      setStatus(null);
      let firstBad: string | null = null;
      fields.forEach((f) => {
        const msg = check[f]();
        showError(f, msg);
        if (msg && !firstBad) firstBad = f;
      });
      if (firstBad) {
        focusTargets[firstBad].focus();
        return;
      }

      // Bots fill hidden fields: pretend success and send nothing
      if (honeypot && honeypot.value) {
        form.hidden = true;
        thanks.hidden = false;
        return;
      }

      const label = submit.textContent;
      submit.disabled = true;
      submit.textContent = t('Sending…');
      try {
        const res = await fetch('/api/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.value.trim(),
            phone: normalizePhone(phone.value),
            whatsapp: normalizePhone(wa.value),
            email: email.value.trim().toLowerCase(),
            district: district.value,
            businessType: business.value,
            ageRange: ageInputs.find((i) => i.checked)?.value,
            lang: document.documentElement.lang || 'en',
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        setStatus("Sorry, we couldn't send your application. Please try again in a moment.");
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
