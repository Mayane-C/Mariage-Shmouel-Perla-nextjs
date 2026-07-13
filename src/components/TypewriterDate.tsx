'use client';

import { useEffect, useState } from 'react';
import { content } from '@/lib/content';

const TYPE_SPEED_MS = 90;
const ERASE_SPEED_MS = 50;
const PAUSE_HOLD_MS = 1900;
const PAUSE_EMPTY_MS = 450;

/**
 * Affiche la date du mariage sous forme d'animation machine à écrire.
 * Alterne indéfiniment entre le texte français et le texte hébreu :
 *   1. Tape la date en français lettre par lettre
 *   2. Marque une pause pour laisser lire
 *   3. Efface caractère par caractère (comme un backspace)
 *   4. Tape la date en hébreu
 *   5. Pause, efface, boucle
 *
 * Le curseur clignotant à droite renforce l'effet 'terminal'.
 */
export function TypewriterDate() {
  const [text, setText] = useState('');
  const [isHebrew, setIsHebrew] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const target = isHebrew ? content.dateHebrew : content.dateGrégorienne;

  useEffect(() => {
    let timer: number | undefined;
    if (isTyping) {
      if (text.length < target.length) {
        timer = window.setTimeout(() => {
          setText(target.slice(0, text.length + 1));
        }, TYPE_SPEED_MS);
      } else {
        timer = window.setTimeout(() => setIsTyping(false), PAUSE_HOLD_MS);
      }
    } else {
      if (text.length > 0) {
        timer = window.setTimeout(() => {
          setText(text.slice(0, -1));
        }, ERASE_SPEED_MS);
      } else {
        timer = window.setTimeout(() => {
          setIsHebrew((h) => !h);
          setIsTyping(true);
        }, PAUSE_EMPTY_MS);
      }
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [text, isTyping, target]);

  return (
    <span
      className={`typewriter-date ${isHebrew ? 'is-hebrew' : ''}`}
      aria-live="polite"
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      <span className="typewriter-text">{text}</span>
      <span className="typewriter-cursor" aria-hidden="true" />
    </span>
  );
}
