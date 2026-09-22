const fs = require('node:fs');

if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function fixImageUrl(imageUrl) {
  if (!imageUrl) {
    return imageUrl;
  }

  return imageUrl.replace('/floresia-app/', '/');
}

async function updateModel(modelName, model) {
  const rows = await model.findMany({
    select: {
      id: true,
      imageUrl: true,
    },
  });

  const rowsToUpdate = rows.filter(
    (row) =>
      row.imageUrl &&
      row.imageUrl.includes('/floresia-app/'),
  );

  console.log(
    `${modelName} : ${rowsToUpdate.length} image(s) à corriger`,
  );

  for (const row of rowsToUpdate) {
    const newImageUrl = fixImageUrl(row.imageUrl);

    console.log(
      `  ${row.imageUrl} -> ${newImageUrl}`,
    );

    await model.update({
      where: {
        id: row.id,
      },
      data: {
        imageUrl: newImageUrl,
      },
    });
  }
}

async function main() {
  console.log('=== Correction des chemins d’images ===');

  await updateModel(
    'Products',
    prisma.product,
  );

  await updateModel(
    'Flowers',
    prisma.flower,
  );

  await updateModel(
    'Articles',
    prisma.article,
  );

  console.log('=== Correction terminée ===');
}

main()
  .catch((error) => {
    console.error('Erreur :', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });