import { content } from '@/lib/content';
import { Ornament } from './Ornament';

export function Bracha() {
  return (
    <section className="bracha block">
      <Ornament n={3} className="block-ornament-corner bl" />
      <Ornament n={3} className="block-ornament-accent bl" />
      <Ornament n={7} className="block-ornament tr" />
      <Ornament n={5} className="block-ornament-2 tr" />

      <h2 className="script-heading">Mazal Tov</h2>

      <div className="hebrew-blessing">
        {content.bracha.hebrewLines.map((line, i) => (
          <span key={i}>
            {line}
            {i < content.bracha.hebrewLines.length - 1 && <br />}
          </span>
        ))}
      </div>

      <p className="translation">{content.bracha.traduction}</p>
    </section>
  );
}
