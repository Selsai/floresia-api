import { randomInt } from 'node:crypto';

const FLOWERS = [
  'Marguerite',
  'Tulipe',
  'Rose',
  'Pivoine',
  'Dahlia',
  'Renoncule',
  'Lys',
  'Hortensia',
];

// Un nom est choisi à la publication et conservé, sans lien avec l’identité.
export function createFlowerAlias(): string {
  return `${FLOWERS[randomInt(FLOWERS.length)]} anonyme`;
}
