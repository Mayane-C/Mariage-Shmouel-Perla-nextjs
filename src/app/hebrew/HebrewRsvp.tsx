'use client';

import { useState } from 'react';
import { content } from '@/lib/content';
import { Ornament } from '@/components/Ornament';

type Status = 'idle' | 'sending' | 'success' | 'error';
type Presence = '' | 'oui' | 'non';

export function HebrewRsvp() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [presence, setPresence] = useState<Presence>('');
  const [adultes, setAdultes] = useState<number>(0);
  const [enfants, setEnfants] = useState<number>(0);

  const handlePresenceChange = (value: Presence) => {
    setPresence(value);
    if (value === 'non') {
      setAdultes(0);
      setEnfants(0);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      token: content.rsvp.token,
      date: new Date().toLocaleDateString('fr-FR'),
      famille: String(data.get('famille') || ''),
      prenom: String(data.get('prenom') || ''),
      nom: String(data.get('nom') || ''),
      presence: String(data.get('presence') || ''),
      adultes: String(adultes),
      enfants: String(enfants),
      message: String(data.get('mot') || ''),
    };

    setStatus('sending');
    setMessage('');
    try {
      await fetch(content.rsvp.endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      setStatus('success');
      setMessage('!תודה רבה, התשובה שלכם התקבלה 💛');
    } catch {
      setStatus('error');
      setMessage('אירעה שגיאה. אנא נסו שוב או פנו אלינו ישירות.');
    }
  }

  const disabled = status === 'sending' || status === 'success';
  const numbersLocked = disabled || presence === 'non';

  return (
    <section id="rsvp" className="rsvp block">
      <Ornament n={3} className="block-ornament-corner tr" />
      <Ornament n={1} className="block-ornament-accent tr" />
      <Ornament n={8} className="block-ornament bl" />
      <Ornament n={1} className="block-ornament-2 bl" />

      <h2 className="script-heading">Répondre à l&apos;invitation</h2>
      <p className="deadline">אנא השיבו עד ה־15 באוגוסט 2026</p>

      <form className="rsvp-form hebrew-form" onSubmit={handleSubmit} noValidate>
        <label className="field-label" htmlFor="he-famille">
          מוזמנים על ידי
        </label>
        <select id="he-famille" name="famille" required disabled={disabled}>
          <option value="">— בחרו —</option>
          <option value="La famille du marié">משפחת החתן</option>
          <option value="La famille de la mariée">משפחת הכלה</option>
        </select>

        <label className="field-label" htmlFor="he-prenom">
          שם פרטי
        </label>
        <input
          type="text"
          id="he-prenom"
          name="prenom"
          autoComplete="given-name"
          required
          disabled={disabled}
        />

        <label className="field-label" htmlFor="he-nom">
          שם משפחה
        </label>
        <input
          type="text"
          id="he-nom"
          name="nom"
          autoComplete="family-name"
          required
          disabled={disabled}
        />

        <span className="field-label">האם תגיעו?</span>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="presence"
              value="oui"
              required
              disabled={disabled}
              checked={presence === 'oui'}
              onChange={() => handlePresenceChange('oui')}
            />{' '}
            כן, בשמחה
          </label>
          <label>
            <input
              type="radio"
              name="presence"
              value="non"
              disabled={disabled}
              checked={presence === 'non'}
              onChange={() => handlePresenceChange('non')}
            />{' '}
            לא נוכל להגיע
          </label>
        </div>

        <div className="nb-row">
          <div>
            <label className="field-label" htmlFor="he-nb-adulte">
              מספר מבוגרים
            </label>
            <input
              type="number"
              id="he-nb-adulte"
              name="nb-adulte"
              min="0"
              value={adultes}
              onChange={(e) => setAdultes(Math.max(0, Number(e.target.value) || 0))}
              disabled={numbersLocked}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="he-nb-enfant">
              מספר ילדים
            </label>
            <input
              type="number"
              id="he-nb-enfant"
              name="nb-enfant"
              min="0"
              value={enfants}
              onChange={(e) => setEnfants(Math.max(0, Number(e.target.value) || 0))}
              disabled={numbersLocked}
            />
          </div>
        </div>

        <label className="field-label" htmlFor="he-mot">
          ברכה לחתן ולכלה
        </label>
        <textarea id="he-mot" name="mot" rows={3} disabled={disabled} />

        <button type="submit" className="btn-primary" disabled={disabled}>
          {status === 'sending' ? '...שולח' : 'שלחו את התשובה'}
        </button>

        {message && (
          <div className={`thanks visible ${status === 'error' ? 'error' : ''}`}>
            {message}
          </div>
        )}
      </form>
    </section>
  );
}
