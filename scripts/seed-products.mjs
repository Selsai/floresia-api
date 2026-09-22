// seed-products.mjs
const API_URL = 'http://localhost:3000';
const TOKEN = process.env.ADMIN_TOKEN;

const products = [
  {
    name: 'Romance – Parfait bouquet de mariage',
    description: 'Roses roses délicates avec eucalyptus et gypsophile',
    price: 32,
    category: 'MARIAGE',
    imageUrl: '/products/produit-1.png',
  },
  {
    name: 'Jardin Secret – Idéal pour un anniversaire',
    description: 'Pivoines roses, tulipes roses/blanches et chrysanthèmes verts',
    price: 52,
    category: 'ANNIVERSAIRE',
    imageUrl: '/products/produit-2.png',
  },
  {
    name: 'Éveil – Bouquet romantique pour mariage',
    description: 'Pivoines roses, tulipes blanches, renoncules et marguerites',
    price: 45,
    category: 'MARIAGE',
    imageUrl: '/products/produit-3.png',
  },
  {
    name: 'Soleil – Bouquet lumineux pour mariage',
    description: 'Pivoines corail, roses jaunes/blanches et astilbe orange',
    price: 38,
    category: 'MARIAGE',
    imageUrl: '/products/produit-4.png',
  },
  {
    name: 'Champêtre – Bouquet bohème pour mariage',
    description: 'Pivoines roses/blanches, renoncules, chardons et eucalyptus',
    price: 65,
    category: 'MARIAGE',
    imageUrl: '/products/produit-5.png',
  },
  {
    name: 'Prestige – Bouquet élégant pour mariage',
    description: 'Roses blanches, lys blancs et eucalyptus élégant',
    price: 58,
    category: 'MARIAGE',
    imageUrl: '/products/produit-6.png',
  },
  {
    name: 'Velours – Parfait bouquet pour Saint-Valentin',
    description: 'Roses rouges veloutées, eucalyptus et gypsophile',
    price: 48,
    category: 'SAINT_VALENTIN',
    imageUrl: '/products/produit-7.png',
  },
  {
    name: 'Fête – Joyeux anniversaire en fleurs',
    description: 'Tournesols, gerberas multicolores et delphiniums bleus',
    price: 42,
    category: 'ANNIVERSAIRE',
    imageUrl: '/products/produit-8.png',
  },
  {
    name: 'Naissance – Doux bouquet pour bébé',
    description: 'Pivoines roses/blanches, renoncules, lys et chardons bleus',
    price: 48,
    category: 'NAISSANCE',
    imageUrl: '/products/produit-9.png',
  },
  {
    name: 'Merci – Bouquet de remerciement sincère',
    description: 'Roses blanches/crème, hydrangéas, lys et eucalyptus',
    price: 44,
    category: 'AUTRE',
    imageUrl: '/products/produit-10.png',
  },
  {
    name: 'Hommage – Bouquet deuil apaisant',
    description: 'Roses blanches, hydrangéas, lys et chrysanthèmes verts',
    price: 40,
    category: 'DEUIL',
    imageUrl: '/products/produit-11.png',
  },
  {
    name: 'Surprise – Joyeux anniversaire en couleurs',
    description: 'Pivoines fuchsia, iris bleus, œillets orange et branches',
    price: 50,
    category: 'ANNIVERSAIRE',
    imageUrl: '/products/produit-12.png',
  },
  {
    name: 'Bouquet Personnalisé',
    description: 'Composition sur-mesure créée via le configurateur',
    price: 0,
    category: 'AUTRE',
    imageUrl: '/products/produit-1.png',
    isCustomizable: true,
  },
];

async function seed() {
  for (const product of products) {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`❌ Échec pour "${product.name}":`, data.message);
    } else {
      console.log(`✅ Créé : ${data.name} (id: ${data.id})`);
    }
  }
}

seed();