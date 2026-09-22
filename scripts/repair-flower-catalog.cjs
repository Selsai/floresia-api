// Targeted, repeatable repair. Does not reseed or reset existing stocks.
const fs = require('node:fs');
const path = require('node:path');
if (fs.existsSync('.env')) process.loadEnvFile('.env');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const secondaryNames = ['Eucalyptus', 'Gypsophile', 'Fougère', 'Ruscus', 'Astilbe'];

(async () => {
  const affected = await prisma.flower.findMany({
    where: { OR: [{ name: 'Rose' }, { name: 'Rose Rouge', color: 'Rouge' }, { name: { in: secondaryNames } }] },
  });
  const backup = path.resolve('backups', `flowers-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, JSON.stringify(affected, null, 2), 'utf8');
  console.log('Sauvegarde :', backup);
  await prisma.$transaction(async tx => {
    const pink = await tx.flower.findFirst({ where: { name: 'Rose', color: 'Rose' } });
    if (!pink) throw new Error('Rose rose introuvable : aucune modification appliquée.');
    await tx.flower.updateMany({ where: { name: 'Rose', color: 'Rose' }, data: { imageUrl: '/flowers/rose-pink.png', isSecondary: false } });
    const lilac = await tx.flower.findFirst({ where: { name: 'Rose', color: 'Lilas' } });
    if (lilac) {
      await tx.flower.updateMany({ where: { name: 'Rose', color: 'Lilas' }, data: { imageUrl: '/flowers/rose-lilas.png', isSecondary: false } });
    } else {
      await tx.flower.create({ data: { name: 'Rose', color: 'Lilas', description: 'Élégance et enchantement', imageUrl: '/flowers/rose-lilas.png', price: pink.price, stock: pink.stock, isSecondary: false } });
    }
    const removed = await tx.flower.deleteMany({ where: { name: 'Rose Rouge', color: 'Rouge', imageUrl: 'https://picsum.photos/300' } });
    const marked = await tx.flower.updateMany({ where: { name: { in: secondaryNames } }, data: { isSecondary: true } });
    console.log('Fleur de démonstration supprimée :', removed.count);
    console.log('Compléments classés :', marked.count);
  }, { timeout: 15000 });
  console.log('Catalogue réparé.');
})().catch(error => {
  console.error('Réparation interrompue :', error.code || error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
