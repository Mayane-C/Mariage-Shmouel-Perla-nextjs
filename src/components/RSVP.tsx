'use client';

import { useState } from 'react';
import { content } from '@/lib/content';
import { Ornament } from './Ornament';

type Status = 'idle' | 'sending' | 'success' | 'error';

export function RSVP() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

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
      adultes: String(data.get('nb-adulte') || '0'),
      enfants: String(data.get('nb-enfant') || '0'),
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
      setMessage('Merci ! Votre réponse a bien été enregistrée. 💛');
    } catch {
      setStatus('error');
      setMessage(
        'Oups, une erreur est survenue. Réessayez dans un instant ou contactez-nous directement.'
      );
    }
  }

  const disabled = status === 'sending' || status === 'success';

  return (
    <section id="rsvp" className="rsvp block">
      <Ornament n={3} className="block-ornament-corner tr" />
      <Ornament n={1} className="block-ornament-accent tr" />
      <Ornament n={8} className="block-ornament bl" />
      <Ornament n={1} className="block-ornament-2 bl" />

      <h2 className="script-heading">Répondre à l&apos;invitation</h2>
      <p className="deadline">Merci de nous répondre {content.deadlineRSVP}</p>

      <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
        <label className="field-label" htmlFor="famille">
          Invité(e) par
        </label>
        <select id="famille" name="famille" required disabled={disabled}>
          <option value="">— Choisir —</option>
          <option>La famille du marié</option>
          <option>La famille de la mariée</option>
        </select>

        <label className="field-label" htmlFor="prenom">
          Prénom
        </label>
        <input type="text" id="prenom" name="prenom" autoComplete="given-name" required disabled={disabled} />

        <label className="field-label" htmlFor="nom">
          Nom
        </label>
        <input type="text" id="nom" name="nom" autoComplete="family-name" required disabled={disabled} />

        <span className="field-label">Confirmez-vous votre présence à la Houppa ?</span>
        <div className="radio-group">
          <label>
            <input type="radio" name="presence" value="oui" required disabled={disabled} /> Oui, avec joie
          </label>
          <label>
            <input type="radio" name="presence" value="non" disabled={disabled} /> Non, absent(e)
          </label>
        </div>

        <div className="nb-row">
          <div>
            <label className="field-label" htmlFor="nb-adulte">
              Nombre d&apos;adultes
            </label>
            <input type="number" id="nb-adulte" name="nb-adulte" min="0" defaultValue={1} disabled={disabled} />
          </div>
          <div>
            <label className="field-label" htmlFor="nb-enfant">
              Nombre d&apos;enfants
            </label>
            <input type="number" id="nb-enfant" name="nb-enfant" min="0" defaultValue={0} disabled={disabled} />
          </div>
        </div>

        <label className="field-label" htmlFor="mot">
          Un petit mot pour les mariés
        </label>
        <textarea id="mot" name="mot" rows={3} disabled={disabled} />

        <button type="submit" className="btn-primary" disabled={disabled}>
          {status === 'sending' ? 'Envoi en cours…' : 'Envoyer notre réponse'}
        </button>

        {message && (
          <div className={`thanks visible ${status === 'error' ? 'error' : ''}`}>{message}</div>
        )}
      </form>
    </section>
  );
}
