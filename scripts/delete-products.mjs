// delete-products.mjs
const API_URL = 'http://localhost:3000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXR1ajk5aXQwMDAwOGhvNDVia20za2c1IiwiZW1haWwiOiJzZWxzYWJpbGFtYWlyaUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3ODg5ODY2ODcsImV4cCI6MTc4OTU5MTQ4N30.I_RJ-iZkvO-PnvDgPrInmxxDUrubPoveeWAIXCF-cUI';

async function deleteAllProducts() {
  // 1. Récupérer la liste des produits
  const resList = await fetch(`${API_URL}/products`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (!resList.ok) {
    console.error('❌ Impossible de lister les produits:', await resList.text());
    return;
  }

  const products = await resList.json();
  console.log(`📦 ${products.length} produits trouvés.`);

  // 2. Supprimer un par un
  for (const p of products) {
    const resDel = await fetch(`${API_URL}/products/${p.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    if (!resDel.ok) {
      console.error(`❌ Échec suppression "${p.name}" (${p.id}):`, await resDel.text());
    } else {
      console.log(`🗑️ Supprimé : ${p.name} (id: ${p.id})`);
    }
  }

  console.log('✅ Tous les produits ont été supprimés.');
}

deleteAllProducts();