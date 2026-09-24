export const CUSTOM_BOUQUET_PRODUCT_ID = 'cmtxj1mhg000c99uhklj59h39';

export type CatalogProduct = {
  name: string;
  description: string;
  price: number;
  category: string;
};

export type CatalogFlower = {
  name: string;
  color: string;
  price: number;
  stock: number;
  isSecondary: boolean;
};

const euros = (value: number) => `${value.toFixed(2).replace('.', ',')} €`;
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

// Exact commercial facts come from the catalogue, not generated model text.
export function catalogReply(
  message: string,
  products: CatalogProduct[],
  flowers: CatalogFlower[],
): string | undefined {
  const question = normalize(message);

  if (/\b(prix|coute|cout|tarif|combien)\b/.test(question)) {
    const namedProducts = products.filter((product) => {
      const fullName = normalize(product.name);
      const shortName = fullName.split(' - ')[0];
      const escapedName = shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const explicitAlias = new RegExp(
        `\\b(?:prix|bouquet|coute|tarif)\\s*(?:(?:du|de|le|la|ce|pour|des|un)\\s+){0,3}[«"“:]?\\s*${escapedName}\\b`,
      );
      return (
        question.includes(fullName) ||
        (shortName.length >= 4 && explicitAlias.test(question))
      );
    });
    if (namedProducts.length) {
      return namedProducts
        .map(
          (product) =>
            `Le bouquet « ${product.name} » coûte ${euros(product.price)}, hors livraison.`,
        )
        .join(' ');
    }
  }

  if (
    /\b(total|combien|revient|cout)\b/.test(question) &&
    !/\b(remise|reduction|pourcent)\b|%/.test(question)
  ) {
    const quantities: Record<string, number> = {
      un: 1,
      une: 1,
      deux: 2,
      trois: 3,
      quatre: 4,
      cinq: 5,
      six: 6,
      sept: 7,
      huit: 8,
      neuf: 9,
      dix: 10,
    };
    const terms = [
      ...question.matchAll(
        /\b(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s+([^€;]+?)\s+a\s+(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)/g,
      ),
    ].map((match) => ({
      quantity: quantities[match[1]] ?? Number(match[1]),
      cents: Math.round(Number(match[3].replace(',', '.')) * 100),
    }));
    if (terms.length >= 2 && terms.every((term) => term.quantity > 0)) {
      const total = terms.reduce(
        (sum, term) => sum + term.quantity * term.cents,
        0,
      );
      const details = terms
        .map((term) => `${term.quantity} × ${euros(term.cents / 100)}`)
        .join(' + ');
      return `Avec les prix indiqués, ${details} = ${euros(total / 100)} pour ces éléments, hors livraison. Chaque complément est compté à l'unité, sans lot.`;
    }
  }

  if (
    /\bsans\s+(?:(?:du|de|aucun)\s+)?feuillages?\b/.test(question) &&
    /\b(bouquet|composer|personnal)/.test(question)
  ) {
    return `Oui, vous pouvez composer un bouquet sans feuillage. Les feuillages et fleurs secondaires sont optionnels : à l'étape « Compléments », cliquez simplement sur « Suivant » sans en sélectionner.`;
  }

  if (
    /\bcomment\b/.test(question) &&
    /\b(creer|composer|faire|personnaliser)\b/.test(question) &&
    /personnal/.test(question)
  ) {
    return `Cliquez sur « Personnalisation » dans le menu du site. Choisissez votre occasion, puis vos fleurs, leurs couleurs et le nombre de tiges ; les compléments sont optionnels et facturés à l'unité. Vous pouvez ensuite choisir un ruban, ajouter un message et placer votre bouquet dans le panier.`;
  }

  const amount = question.match(/\b(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?\b)/);
  const budget = amount ? Number(amount[1].replace(',', '.')) : undefined;
  const mainFlowers = flowers.filter(
    (flower) => !flower.isSecondary && flower.stock > 0,
  );
  if (
    /\bbouquets?\b/.test(question) &&
    budget !== undefined &&
    budget >= 0 &&
    mainFlowers.length &&
    !products.some((product) => product.price <= budget) &&
    !mainFlowers.some((flower) => flower.price <= budget)
  ) {
    const minimum = Math.min(...mainFlowers.map((flower) => flower.price));
    return `Avec un budget de ${euros(budget)}, aucun bouquet prêt du catalogue ni fleur principale disponible ne convient actuellement. Les fleurs principales pour la personnalisation commencent à ${euros(minimum)} la tige. Vous pourrez utiliser « Personnalisation » si vous souhaitez augmenter votre budget.`;
  }

  const occasions: [RegExp, string, string][] = [
    [/\bmariage\b/, 'MARIAGE', 'un mariage'],
    [/\banniversaire\b/, 'ANNIVERSAIRE', 'un anniversaire'],
    [/\bdeuil\b/, 'DEUIL', 'un deuil'],
    [/\bnaissance\b/, 'NAISSANCE', 'une naissance'],
    [/\bsaint-valentin\b/, 'SAINT_VALENTIN', 'la Saint-Valentin'],
  ];
  const occasion = occasions.find(([pattern]) => pattern.test(question));
  // More detailed style/season questions still use Gemini with the real catalogue.
  if (
    occasion &&
    /\bbouquets?\b/.test(question) &&
    /recommand|conseill|propos|quel/.test(question) &&
    !/\b(saison|blanc|blanche|blanches|blancs|rouge|rouges|rose|roses|parfum|sans|composition|compose|personnalise)\b/.test(
      question,
    )
  ) {
    const choices = products
      .filter(
        (product) =>
          product.category === occasion[1] &&
          (budget === undefined || product.price <= budget),
      )
      .slice(0, 4);
    if (!choices.length) {
      return `Je n'ai pas de bouquet classé pour ${occasion[2]}${budget !== undefined ? ` à ${euros(budget)} ou moins` : ''} dans le catalogue fourni. Vous pouvez explorer « Personnalisation » pour composer votre bouquet ; son prix dépend des tiges choisies.`;
    }
    return `Pour ${occasion[2]}, voici des bouquets du catalogue Florésia :\n${choices.map((product) => `• ${product.name} — ${euros(product.price)}`).join('\n')}\nCes prix sont hors livraison ; les disponibilités sont à vérifier dans la boutique.`;
  }
  return undefined;
}
