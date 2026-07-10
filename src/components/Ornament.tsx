import { content } from '@/lib/content';

interface OrnamentProps {
  /** Index 1..8 dans content.images.ornaments */
  n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  /** Classes CSS positionnelles (ex : "block-ornament tr", "block-ornament-2 bl") */
  className: string;
}

/**
 * Petit helper pour insérer un ornement floral avec la bonne classe
 * de positionnement (block-ornament, block-ornament-2, accent, corner, etc.).
 */
export function Ornament({ n, className }: OrnamentProps) {
  return (
    <img
      className={className}
      src={content.images.ornaments[n - 1]}
      alt=""
      aria-hidden="true"
    />
  );
}
