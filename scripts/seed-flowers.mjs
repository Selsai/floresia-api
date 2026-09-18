// seed-flowers.mjs
const API_URL = 'http://localhost:3000';
const TOKEN = process.env.ADMIN_TOKEN;

const IMG_BASE = '/floresia-app/flowers';

const flowers = [
  // ── Rose ──
  { name: 'Rose', color: 'Rouge', price: 3.50, description: 'Passion et amour ardent', imageUrl: `${IMG_BASE}/rose-red.png` },
  { name: 'Rose', color: 'Rose', price: 3.50, description: 'Tendresse et admiration', imageUrl: `${IMG_BASE}/rose-pink.png` },
  { name: 'Rose', color: 'Lilas', price: 3.50, description: 'Élégance et enchantement', imageUrl: `${IMG_BASE}/rose-lilas.png` },
  { name: 'Rose', color: 'Blanche', price: 3.50, description: 'Pureté et innocence', imageUrl: `${IMG_BASE}/rose-white.png` },
  { name: 'Rose', color: 'Jaune', price: 3.50, description: 'Amitié et joie', imageUrl: `${IMG_BASE}/rose-yellow.png` },
  { name: 'Rose', color: 'Saumon', price: 3.50, description: 'Gratitude', imageUrl: `${IMG_BASE}/rose-saumon.png` },

  // ── Pivoine ──
  { name: 'Pivoine', color: 'Rose', price: 5.00, description: 'Amour romantique', imageUrl: `${IMG_BASE}/pivoine-rose.png` },
  { name: 'Pivoine', color: 'Blanche', price: 5.00, description: 'Honneur et sincérité', imageUrl: `${IMG_BASE}/pivoine-white.png` },
  { name: 'Pivoine', color: 'Orange', price: 5.00, description: 'Bonheur éclatant', imageUrl: `${IMG_BASE}/pivoine-orange.png` },
  { name: 'Pivoine', color: 'Saumon', price: 5.00, description: 'Douceur', imageUrl: `${IMG_BASE}/pivone-saumon.png` },

  // ── Tulipe ──
  { name: 'Tulipe', color: 'Rose', price: 2.50, description: 'Affection', imageUrl: `${IMG_BASE}/tulipe-pink.png` },
  { name: 'Tulipe', color: 'Rouge', price: 2.50, description: 'Amour véritable', imageUrl: `${IMG_BASE}/tulipe-rouge.png` },
  { name: 'Tulipe', color: 'Blanche', price: 2.50, description: 'Pardon', imageUrl: `${IMG_BASE}/tulipe-blanche.png` },
  { name: 'Tulipe', color: 'Jaune', price: 2.50, description: 'Joie', imageUrl: `${IMG_BASE}/tulipe-jaune.png` },
  { name: 'Tulipe', color: 'Fushia', price: 2.50, description: 'Passion intense', imageUrl: `${IMG_BASE}/tulipe-fushia.png` },
  { name: 'Tulipe', color: 'Lilas', price: 2.50, description: 'Royauté', imageUrl: `${IMG_BASE}/tulipe-lilas.png` },
  { name: 'Tulipe', color: 'Saumon', price: 2.50, description: 'Chaleur', imageUrl: `${IMG_BASE}/tulipe-saumon.png` },
  { name: 'Tulipe', color: 'Orange', price: 2.50, description: 'Énergie', imageUrl: `${IMG_BASE}/tulipe-orange.png` },

  // ── Lys ──
  { name: 'Lys', color: 'Blanc', price: 4.00, description: 'Pureté divine', imageUrl: `${IMG_BASE}/lys-white.png` },
  { name: 'Lys', color: 'Rose', price: 4.00, description: 'Prospérité', imageUrl: `${IMG_BASE}/lys-pink.png` },

  // ── Renoncule ──
  { name: 'Renoncule', color: 'Rose', price: 3.00, description: 'Charme', imageUrl: `${IMG_BASE}/renoncule-pink.png` },
  { name: 'Renoncule', color: 'Rouge', price: 3.00, description: 'Attraction', imageUrl: `${IMG_BASE}/renoncule-red.png` },
  { name: 'Renoncule', color: 'Blanche', price: 3.00, description: 'Pureté', imageUrl: `${IMG_BASE}/renoncule-white.png` },
  { name: 'Renoncule', color: 'Saumon', price: 3.00, description: 'Tendresse', imageUrl: `${IMG_BASE}/renoncule-saumon.png` },

  // ── Dahlia ──
  { name: 'Dahlia', color: 'Rose', price: 4.50, description: 'Élégance', imageUrl: `${IMG_BASE}/dahlia-pink.png` },
  { name: 'Dahlia', color: 'Jaune', price: 4.50, description: 'Joie pure', imageUrl: `${IMG_BASE}/dahlia-jaune.png` },
  { name: 'Dahlia', color: 'Fushia', price: 4.50, description: 'Vitalité', imageUrl: `${IMG_BASE}/dahlia-fushia.png` },
  { name: 'Dahlia', color: 'Saumon', price: 4.50, description: 'Raffinement', imageUrl: `${IMG_BASE}/dahlia-saumon.png` },
  { name: 'Dahlia', color: 'Blanc', price: 4.50, description: 'Dignité', imageUrl: `${IMG_BASE}/dahlia-white.png` },
  { name: 'Dahlia', color: 'Bleu', price: 4.50, description: 'Sérénité', imageUrl: `${IMG_BASE}/dahlia-blue.png` },

  // ── Marguerite ──
  { name: 'Marguerite', color: 'Blanche', price: 2.00, description: 'Innocence', imageUrl: `${IMG_BASE}/marguerite-white.png` },
  { name: 'Marguerite', color: 'Rose', price: 2.00, description: 'Gaieté', imageUrl: `${IMG_BASE}/marguerite-pink.png` },
  { name: 'Marguerite', color: 'Orange', price: 2.00, description: 'Enthousiasme', imageUrl: `${IMG_BASE}/marguerite-orange.png` },

  // ── Hortensia ──
  { name: 'Hortensia', color: 'Bleu', price: 5.50, description: 'Sincérité', imageUrl: `${IMG_BASE}/hortensia-blue.png` },
  { name: 'Hortensia', color: 'Rose', price: 5.50, description: 'Romance', imageUrl: `${IMG_BASE}/hortensia-pink.png` },
  { name: 'Hortensia', color: 'Violet', price: 5.50, description: 'Profondeur', imageUrl: `${IMG_BASE}/hortensia-purple.png` },
  { name: 'Hortensia', color: 'Blanc', price: 5.50, description: 'Grâce', imageUrl: `${IMG_BASE}/hortensia-white.png` },

  // ── Œillet ──
  { name: 'Œillet', color: 'Rose', price: 2.50, description: 'Gratitude', imageUrl: `${IMG_BASE}/oeillet-pink.png` },
  { name: 'Œillet', color: 'Bleu', price: 2.50, description: 'Fidélité', imageUrl: `${IMG_BASE}/oeillet-blue.png` },
  { name: 'Œillet', color: 'Saumon', price: 2.50, description: 'Admiration', imageUrl: `${IMG_BASE}/oeillet-saumon.png` },
  { name: 'Œillet', color: 'Blanc', price: 2.50, description: 'Amour pur', imageUrl: `${IMG_BASE}/oeillet-white.png` },

  // ── Compléments / feuillages (fleurs secondaires) ──
  { name: 'Eucalyptus', color: 'Vert', price: 2.00, description: 'Feuillage complémentaire pour structurer un bouquet', imageUrl: `${IMG_BASE}/feuillage-eucalyptus.png` },
  { name: 'Gypsophile', color: 'Blanc', price: 1.50, description: 'Petites fleurs légères pour aérer une composition', imageUrl: `${IMG_BASE}/gysophile-white.png` },
  { name: 'Gypsophile', color: 'Rose', price: 1.50, description: 'Petites fleurs légères pour aérer une composition', imageUrl: `${IMG_BASE}/gysophile-pink.png` },
  { name: 'Gypsophile', color: 'Bleu', price: 1.50, description: 'Petites fleurs légères pour aérer une composition', imageUrl: `${IMG_BASE}/gysophile-blue.png` },
  { name: 'Gypsophile', color: 'Jaune', price: 1.50, description: 'Petites fleurs légères pour aérer une composition', imageUrl: `${IMG_BASE}/gysophile-yellow.png` },
  { name: 'Fougère', color: 'Vert', price: 1.80, description: 'Feuillage naturel pour un style champêtre', imageUrl: `${IMG_BASE}/feuillage-fougere.png` },
  { name: 'Ruscus', color: 'Vert', price: 2.20, description: 'Feuillage élégant et structuré', imageUrl: `${IMG_BASE}/feuillage-ruscus.png` },
  { name: 'Astilbe', color: 'Rose', price: 2.50, description: 'Petites grappes plumeuses pour du volume', imageUrl: `${IMG_BASE}/astilbe-pink.png` },
  { name: 'Astilbe', color: 'Rouge', price: 2.50, description: 'Petites grappes plumeuses pour du volume', imageUrl: `${IMG_BASE}/astilbe-red.png` },
  { name: 'Astilbe', color: 'Saumon', price: 2.50, description: 'Petites grappes plumeuses pour du volume', imageUrl: `${IMG_BASE}/astilbe-saumon.png` },
];

async function seed() {
  const listResponse = await fetch(`${API_URL}/flowers`);
  if (!listResponse.ok) throw new Error('Impossible de lire le catalogue des fleurs.');
  const existing = await listResponse.json();
  const secondaryNames = new Set(['Eucalyptus', 'Gypsophile', 'Fougère', 'Ruscus', 'Astilbe']);
  for (const flower of flowers) {
    const found = existing.find((f) => f.name === flower.name && f.color === flower.color);
    const res = await fetch(`${API_URL}/flowers${found ? `/${found.id}` : ''}`, {
      method: found ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ ...flower, isSecondary: secondaryNames.has(flower.name), ...(found ? {} : { stock: 100 }) }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`❌ Échec pour "${flower.name} ${flower.color}" :`, data.message);
    } else {
      console.log(`✅ Créé : ${data.name} ${data.color} (id: ${data.id})`);
    }
  }
}

seed();
