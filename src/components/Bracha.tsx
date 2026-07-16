import { content } from '@/lib/content';
import { Ornament } from './Ornament';

export function Bracha() {
  return (
    <section id="bracha" className="bracha block">
      <Ornament n={3} className="block-ornament-corner bl" />
      <Ornament n={3} className="block-ornament-accent bl" />
      <Ornament n={7} className="block-ornament tr" />
      <Ornament n={5} className="block-ornament-2 tr" />

      <img
        className="rabbi-bracha"
        src="/images/rabbi-bracha.png"
        alt={content.bracha.imageAlt}
      />

      <p className="translation">{content.bracha.traduction}</p>
    </section>
  );
}
