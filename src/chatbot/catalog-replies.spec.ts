import { catalogReply, CatalogProduct, CatalogFlower } from './catalog-replies';

const products: CatalogProduct[] = [
  { name: 'Romance – Parfait bouquet de mariage', price: 32, category: 'MARIAGE', description: 'Roses roses' },
  { name: 'Jardin Secret – Idéal pour un anniversaire', price: 52, category: 'ANNIVERSAIRE', description: 'Pivoines et tulipes' },
  { name: 'Éveil – Bouquet romantique pour mariage', price: 45, category: 'MARIAGE', description: 'Pivoines et tulipes' },
  { name: 'Merci – Bouquet de remerciement sincère', price: 44, category: 'AUTRE', description: 'Roses blanches' },
];
const flowers: CatalogFlower[] = [
  { name: 'Rose', color: 'Rose', price: 3.5, stock: 100, isSecondary: false },
  { name: 'Marguerite', color: 'Blanche', price: 2, stock: 100, isSecondary: false },
  { name: 'Eucalyptus', color: 'Vert', price: 2, stock: 100, isSecondary: true },
  { name: 'Gypsophile', color: 'Blanc', price: 1.5, stock: 100, isSecondary: true },
];

describe('Réponses factuelles de Flora', () => {
  it('recommande uniquement les bouquets de mariage du catalogue', () => {
    const reply = catalogReply('Quels bouquets Florésia peux-tu me recommander pour un mariage ?', products, flowers);
    expect(reply).toContain(products[0].name);
    expect(reply).toContain(products[2].name);
    expect(reply).not.toContain(products[1].name);
    expect(reply).not.toMatch(/Élégance Blanche|Douceur Rosée/);
  });

  it.each([
    ['Quel est le prix du bouquetJardin Secret – Idéal pour un anniversaire', '52,00 €'],
    ['le prix de ce bouquet : Éveil – Bouquet romantique pour mariage ?', '45,00 €'],
    ['Combien coûte le bouquet Jardin Secret ?', '52,00 €'],
  ])('répond au prix réel : %s', (message, expected) => {
    expect(catalogReply(message, products, flowers)).toContain(expected);
  });

  it('ne confond pas un merci avec le nom du bouquet Merci', () => {
    expect(catalogReply('Merci, quel prix pour une rose ?', products, flowers)).toBeUndefined();
  });

  it('reflète une mise à jour du prix sans valeur codée en dur', () => {
    expect(catalogReply('Quel est le prix du bouquet Jardin Secret ?', [
      { ...products[1], price: 57.25 },
    ], flowers)).toContain('57,25 €');
  });

  it('répond clairement oui pour un bouquet sans feuillage', () => {
    const reply = catalogReply('Puis-je composer un bouquet sans feuillage ?', products, flowers);
    expect(reply).toMatch(/^Oui,/);
    expect(reply).toContain('optionnels');
  });

  it('explique les étapes avec le libellé de la navigation', () => {
    const reply = catalogReply('Comment créer un bouquet personnalisé sur Florésia ?', products, flowers);
    expect(reply).toContain('Personnalisation');
    expect(reply).not.toContain('/personnaliser');
  });

  it('calcule les roses ET l’eucalyptus à l’unité', () => {
    const reply = catalogReply('Trois roses à 3,50 € et une tige d’eucalyptus à 2 € : quel est le total hors livraison ?', products, flowers);
    expect(reply).toContain('12,50 €');
    expect(reply).toContain('1 × 2,00 €');
  });

  it('calcule en centimes sans arrondi flottant erroné', () => {
    expect(catalogReply('2 fleurs à 0,10 € et 1 fleur à 0,20 € : quel total ?', products, flowers)).toContain('0,40 €');
  });

  it('n’applique pas un calcul partiel ignorant une remise', () => {
    expect(catalogReply('3 roses à 3,50 € et 1 eucalyptus à 2 € avec 10% de remise : quel total ?', products, flowers)).toBeUndefined();
  });

  it('refuse le budget de 1 euro sans prix ni phrase inventés', () => {
    const reply = catalogReply('Quel bouquet puis-je acheter pour 1 € ?', products, flowers);
    expect(reply).toContain('aucun bouquet');
    expect(reply).toContain('2,00 €');
    expect(reply).not.toMatch(/Jui|l.commander/);
  });

  it('respecte le budget demandé pour les recommandations', () => {
    const reply = catalogReply('Quels bouquets pour un mariage avec 35 euros maximum ?', products, flowers);
    expect(reply).toContain(products[0].name);
    expect(reply).not.toContain(products[2].name);
  });
});
