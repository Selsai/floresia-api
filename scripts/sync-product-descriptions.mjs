// Synchronise les descriptions vérifiées visuellement sans recréer les produits.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const descriptionsByName = {
  'Romance – Parfait bouquet de mariage': 'Roses roses délicates avec eucalyptus et gypsophile',
  'Jardin Secret – Idéal pour un anniversaire': 'Pivoines roses, tulipes roses et blanches, renoncules blanches, chrysanthèmes verts et camomille',
  'Éveil – Bouquet romantique pour mariage': 'Pivoines corail, roses jaunes, renoncules blanches, astilbes orange et eucalyptus',
  'Soleil – Bouquet lumineux pour mariage': 'Roses, pivoines et renoncules blanches, gypsophile, fleurs de pois de senteur et eucalyptus',
  'Champêtre – Bouquet bohème pour mariage': 'Pivoines roses et blanches, renoncules, chardons et eucalyptus',
  'Prestige – Bouquet élégant pour mariage': 'Roses blanches, lys blancs et eucalyptus',
  'Velours – Parfait bouquet pour Saint-Valentin': 'Roses rouges veloutées, renoncules rouges, eucalyptus et gypsophile',
  'Fête – Joyeux anniversaire en fleurs': 'Tournesols, gerberas multicolores, delphiniums bleus, pivoines fuchsia et feuillages',
  'Naissance – Doux bouquet pour bébé': 'Pivoines roses et blanches, renoncules, roses, chardons bleus et eucalyptus',
  'Merci – Bouquet de remerciement sincère': 'Pivoines ivoire, hortensia bleu, roses et lys blancs, œillets verts, chardons et eucalyptus',
  'Hommage – Bouquet deuil apaisant': 'Pivoines ivoire, roses et lys blancs, renoncules, œillets verts et eucalyptus',
  'Surprise – Joyeux anniversaire en couleurs': 'Pivoines fuchsia, iris bleus, œillets orange, chardons, solidage et branches fleuries',
};

try {
  for (const [name, description] of Object.entries(descriptionsByName)) {
    const result = await prisma.product.updateMany({
      where: { name },
      data: { description },
    });
    console.log(`${name}: ${result.count} produit(s) mis à jour`);
  }
} finally {
  await prisma.$disconnect();
}
