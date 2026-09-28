// Rôle : Configuration ou point d’entrée de l’API Florésia.
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

  // Les conseils d'entretien les plus fréquents restent disponibles même si
  // le service d'IA externe est ralenti ou temporairement indisponible.
  if (
    /\b(entretien|entretenir|conserver|garder|durer|faner)\b/.test(question) &&
    /\broses?\b/.test(question)
  ) {
    return `Recoupez les tiges de vos roses en biais sur environ 2 cm avec un outil propre, puis placez-les dans un vase lavé rempli d'eau fraîche. Retirez les feuilles qui tremperaient dans l'eau, changez l'eau tous les deux jours et gardez le bouquet à l'écart du soleil direct, des radiateurs et des fruits mûrs.`;
  }

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

// Réponse de continuité lorsque Gemini est indisponible. Elle couvre les
// demandes florales courantes sans inventer une information commerciale.
export function offlineFloralReply(
  message: string,
  products: CatalogProduct[],
  flowers: CatalogFlower[],
): string {
  const question = normalize(message);

  if (/\b(commande|livraison|suivi|remboursement|retour)\b/.test(question)) {
    return `Je n'ai pas accès à vos informations personnelles ni au suivi d'une commande. Consultez « Mes commandes » depuis votre compte ou utilisez la page Contact pour obtenir une aide adaptée.`;
  }
  if (/\b(horaire|adresse|telephone|contacter|contact)\b/.test(question)) {
    return `Les informations administratives à jour sont disponibles sur la page Contact de Florésia. Je préfère vous y orienter plutôt que de vous donner un horaire ou une adresse que je ne peux pas vérifier.`;
  }
  if (/\b(entretien|entretenir|conserver|garder|durer|faner|eau|vase)\b/.test(question)) {
    return `Pour prolonger la tenue d'un bouquet, utilisez un vase propre, recoupez les tiges en biais et retirez les feuilles qui seraient sous l'eau. Renouvelez l'eau tous les deux jours et placez les fleurs loin du soleil direct, des radiateurs, des courants d'air et des fruits mûrs.`;
  }
  if (/\b(chien|chat|animal|toxique|toxicite|ingestion)\b/.test(question)) {
    return `Certaines fleurs peuvent être toxiques pour les animaux, mais le risque dépend de l'espèce exacte. Éloignez le bouquet de l'animal et, en cas d'ingestion ou de symptôme, contactez rapidement un vétérinaire ou un centre antipoison vétérinaire avec le nom précis de la plante.`;
  }
  if (/\b(signification|symbol|couleur)\b/.test(question)) {
    return `La signification dépend du contexte : le rouge évoque souvent l'amour, le rose la tendresse, le blanc la pureté ou l'hommage, et le jaune la joie ou l'amitié. Dites-moi la couleur, la fleur et l'occasion concernées pour que je vous conseille plus précisément.`;
  }
  if (/\b(mariage|anniversaire|naissance|deuil|remerciement|amour|saint-valentin)\b/.test(question)) {
    const category = question.includes('mariage') ? 'MARIAGE'
      : question.includes('anniversaire') ? 'ANNIVERSAIRE'
        : question.includes('naissance') ? 'NAISSANCE'
          : question.includes('deuil') ? 'DEUIL'
            : question.includes('saint-valentin') || question.includes('amour') ? 'SAINT_VALENTIN' : 'AUTRE';
    const suggestions = products.filter((p) => p.category === category).slice(0, 3);
    if (suggestions.length) {
      return `Parmi les bouquets actuellement présentés par Florésia, vous pouvez regarder : ${suggestions.map((p) => `« ${p.name} » à ${euros(p.price)}`).join(', ')}. Vérifiez leur fiche pour choisir selon les couleurs et le message que vous souhaitez transmettre.`;
    }
    return `Pour cette occasion, privilégiez une composition adaptée au message que vous souhaitez transmettre. L'atelier « Personnalisation » vous permet de choisir les fleurs, les couleurs et le ruban parmi les éléments disponibles.`;
  }
  if (/\b(saison|printemps|ete|automne|hiver|mois)\b/.test(question)) {
    return `La saisonnalité varie selon la région, la culture et l'approvisionnement. Pour un choix responsable, privilégiez les fleurs disponibles dans la boutique au moment de votre commande et demandez confirmation sur la page Contact si l'origine ou la saison est déterminante.`;
  }
  if (/\b(personnal|composer|composition|bouquet)\b/.test(question)) {
    const available = [...new Set(flowers.filter((f) => f.stock > 0).map((f) => f.name))].slice(0, 4);
    return available.length
      ? `Vous pouvez utiliser l'atelier « Personnalisation » et composer votre bouquet à partir des familles actuellement disponibles, par exemple ${available.join(', ')}. Choisissez d'abord l'occasion, puis les fleurs ; les compléments restent optionnels avant le ruban et le message.`
      : `Vous pouvez utiliser l'atelier « Personnalisation » : choisissez l'occasion, les fleurs, les compléments éventuels, le ruban et le message avant l'ajout au panier.`;
  }
  return `Je rencontre un ralentissement du service de réponse, mais je peux toujours vous guider sur le choix d'un bouquet, sa personnalisation, l'entretien des fleurs ou leur signification. Reformulez votre question en précisant la fleur, l'occasion ou le budget concerné.`;
}
