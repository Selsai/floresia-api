// Read-only regression checks against the real database; no Gemini quota used.
require('reflect-metadata');
require('ts-node').register({ transpileOnly: true });
const fs = require('node:fs');
const assert = require('node:assert/strict');
if (fs.existsSync('.env')) process.loadEnvFile('.env');
const { ConfigService } = require('@nestjs/config');
const { PrismaService } = require('../src/prisma/prisma.service');
const { ChatbotService } = require('../src/chatbot/chatbot.service');
const questions = [
  ['Quels bouquets Florésia peux-tu me recommander pour un mariage ?', /Romance.*32,00/],
  ['Quel est le prix du bouquetJardin Secret – Idéal pour un anniversaire', /52,00/],
  ['le prix de ce bouquet : Éveil – Bouquet romantique pour mariage ?', /45,00/],
  ['Quel bouquet puis-je acheter pour 1 € ?', /aucun bouquet/],
  ['Comment créer un bouquet personnalisé sur Florésia ?', /Personnalisation/],
  ['Puis-je composer un bouquet sans feuillage ?', /^Oui,/],
  ['Trois roses à 3,50 € et une tige d’eucalyptus à 2 € : quel est le total hors livraison ?', /12,50/],
];
(async () => {
  const prisma = new PrismaService();
  try {
    const service = new ChatbotService(new ConfigService(), prisma);
    service.ai.models.generateContent = async () => { throw new Error('Unexpected Gemini call for a factual question'); };
    const results = [];
    for (const [message, expected] of questions) {
      const { reply } = await service.sendMessage({
        message,
        history: [{ role: 'model', content: 'Les bouquets Élégance Blanche et Douceur Rosée existent chez Florésia.' }],
      }, `catalog-regression-${process.pid}`);
      assert.match(reply, expected);
      assert.doesNotMatch(reply, /Élégance Blanche|Douceur Rosée|Jui/);
      results.push({ question: message, reply });
      console.log('OK:', message, '\n', reply);
    }
    fs.mkdirSync('docs', { recursive: true });
    fs.writeFileSync('docs/flora-catalog-regressions.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2), 'utf8');
    console.log('7 régressions vérifiées avec la base réelle ; aucun appel Gemini.');
  } finally {
    await prisma.$disconnect();
  }
})().catch(error => {
  console.error('Échec des régressions :', error.code || error.message);
  process.exitCode = 1;
});
