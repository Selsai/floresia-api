// seed-articles.mjs
const API_URL = 'http://localhost:3000';
const TOKEN = process.env.ADMIN_TOKEN;


const articles = [
  {
    title: '10 fleurs de printemps pour égayer votre intérieur',
    excerpt: 'Découvrez notre sélection de fleurs printanières qui apporteront fraîcheur et couleur à votre maison dès les premiers beaux jours.',
    category: 'Conseils',
    imageUrl: '/floresia-app/blog/blog-printemps.png',
    readTime: '5 min',
    displayAuthorName: 'Marie Dubois',
    displayAuthorBio: 'Fleuriste passionnée depuis 15 ans',
    createdAt: '2026-02-15T09:00:00.000Z',
    content: `
        <p>Le printemps approche et avec lui l'envie de renouveau ! Quoi de mieux que des fleurs fraîches pour célébrer cette saison pleine de promesses ? Voici notre sélection de 10 fleurs printanières qui transformeront votre intérieur.</p>

        <h2>1. Les Tulipes</h2>
        <p>Emblématiques du printemps, les tulipes offrent une palette de couleurs incroyable. Du blanc pur au rouge profond, en passant par le rose tendre et le jaune vif, elles s'adaptent à tous les styles de décoration.</p>
        
        <p><strong>Astuce d'entretien :</strong> Coupez les tiges en biseau et changez l'eau tous les jours. Les tulipes continuent de pousser dans le vase !</p>

        <h2>2. Les Jonquilles</h2>
        <p>Avec leurs trompettes dorées, les jonquilles annoncent le retour du soleil. Leur parfum délicat embaume toute la maison et leur couleur jaune éclatante illumine n'importe quelle pièce.</p>

        <h2>3. Les Jacinthes</h2>
        <p>Ces fleurs parfumées au charme romantique sont parfaites pour créer une ambiance printanière. Leurs grappes serrées de petites fleurs dégagent un parfum enivrant.</p>

        <blockquote>
          "Les fleurs de printemps sont les rêves de l'hiver racontés, le matin, à la table des anges." - Khalil Gibran
        </blockquote>

        <h2>4. Les Pivoines</h2>
        <p>Généreuses et élégantes, les pivoines sont les reines du printemps. Leurs pétales froissés et leur parfum subtil en font des fleurs très prisées pour les bouquets raffinés.</p>

        <h2>5. Les Renoncules</h2>
        <p>Avec leurs pétales papier froissé disposés en rosace, les renoncules apportent une touche de délicatesse. Disponibles dans de nombreux coloris, elles se marient parfaitement avec d'autres fleurs.</p>

        <h2>Conseils d'entretien général</h2>
        <ul>
          <li>Changez l'eau tous les 2-3 jours</li>
          <li>Recoupez les tiges régulièrement</li>
          <li>Évitez l'exposition directe au soleil</li>
          <li>Retirez les feuilles qui trempent dans l'eau</li>
          <li>Ajoutez un conservateur floral dans l'eau</li>
        </ul>

        <p>En suivant ces conseils, vos bouquets printaniers garderont leur fraîcheur pendant 7 à 10 jours. N'hésitez pas à mélanger plusieurs variétés pour créer des compositions uniques !</p>
      `,
  },
  {
    title: 'Comment conserver un bouquet plus longtemps ?',
    excerpt: "Nos astuces d'expert pour prolonger la vie de vos bouquets jusqu'à 2 semaines.",
    category: 'Tutos',
    imageUrl: '/floresia-app/blog/blog-entretien.png',
    readTime: '4 min',
    displayAuthorName: 'Sophie Laurent',
    displayAuthorBio: 'Experte en art floral',
    createdAt: '2026-02-10T09:00:00.000Z',
    content: `
        <p>Vous venez de recevoir un magnifique bouquet et vous voulez en profiter le plus longtemps possible ? Suivez nos conseils d'expert pour prolonger la vie de vos fleurs jusqu'à 2 semaines !</p>

        <h2>1. La préparation initiale est cruciale</h2>
        <p>Dès réception de votre bouquet, plusieurs gestes sont essentiels :</p>
        
        <ul>
          <li><strong>Coupez les tiges en biseau</strong> à environ 2-3 cm du bas, avec un couteau bien aiguisé</li>
          <li><strong>Retirez toutes les feuilles</strong> qui risquent de tremper dans l'eau</li>
          <li><strong>Utilisez un vase propre</strong> rempli d'eau fraîche</li>
          <li><strong>Ajoutez de la nourriture pour fleurs</strong> (fournie avec le bouquet)</li>
        </ul>

        <h2>2. L'emplacement idéal</h2>
        <p>L'endroit où vous placez votre bouquet a un impact majeur sur sa durée de vie :</p>
        
        <blockquote>
          Évitez les sources de chaleur, les courants d'air et la lumière directe du soleil. Une température fraîche (15-18°C) est idéale.
        </blockquote>

        <h2>3. L'entretien quotidien</h2>
        <p>Pour maximiser la longévité de votre bouquet :</p>
        
        <ul>
          <li>Changez l'eau tous les 2 jours (tous les jours pour les tulipes)</li>
          <li>Recoupez les tiges de 1 cm à chaque changement d'eau</li>
          <li>Nettoyez le vase à chaque fois</li>
          <li>Retirez les fleurs fanées au fur et à mesure</li>
        </ul>

        <h2>4. Astuces de grand-mère qui fonctionnent</h2>
        <p>Certains remèdes naturels peuvent vraiment prolonger la vie de vos fleurs :</p>
        
        <ul>
          <li><strong>Une pièce de cuivre</strong> dans l'eau limite le développement des bactéries</li>
          <li><strong>Un morceau de sucre</strong> nourrit les fleurs</li>
          <li><strong>Quelques gouttes de vinaigre</strong> acidifient l'eau et ralentissent la décomposition</li>
          <li><strong>Une aspirine écrasée</strong> garde l'eau plus claire plus longtemps</li>
        </ul>

        <h2>5. Cas particuliers</h2>
        <p><strong>Roses :</strong> Coupez les tiges sous l'eau pour éviter les bulles d'air. Elles peuvent durer jusqu'à 2 semaines.</p>
        
        <p><strong>Tulipes :</strong> Elles continuent de pousser dans le vase ! Recoupez-les régulièrement et changez l'eau quotidiennement.</p>
        
        <p><strong>Lys :</strong> Retirez les étamines (parties jaunes) pour éviter les taches et prolonger la floraison.</p>

        <p>En appliquant ces conseils, vous pourrez profiter de vos bouquets bien plus longtemps. Et n'oubliez pas : même fanées, certaines fleurs comme les roses peuvent être séchées pour créer de jolies compositions !</p>
      `,
  },
  {
    title: 'Signification des couleurs de roses',
    excerpt: 'Rouge pour la passion, blanc pour la pureté... Découvrez le langage secret des roses.',
    category: 'Déco',
    imageUrl: '/floresia-app/blog/blog-couleurs.png',
    readTime: '3 min',
    displayAuthorName: 'Emma Martin',
    displayAuthorBio: 'Spécialiste en symbolique florale',
    createdAt: '2026-02-05T09:00:00.000Z',
    content: `
        <p>Les roses ne sont pas seulement belles, elles portent aussi des messages. Chaque couleur a sa propre signification. Voici le guide complet pour choisir la couleur parfaite selon votre message.</p>

        <h2>Roses Rouges : La Passion</h2>
        <p>Symbole universel de l'amour passionné et du désir, les roses rouges sont le choix classique pour déclarer sa flamme. Plus la teinte est foncée, plus le message d'amour est intense.</p>

        <h2>Roses Blanches : La Pureté</h2>
        <p>Elles symbolisent l'innocence, la pureté et les nouveaux départs. Parfaites pour un mariage ou pour exprimer un amour sincère et respectueux.</p>

        <h2>Roses Roses : La Tendresse</h2>
        <p>Les roses roses représentent la douceur, l'admiration et la gratitude. Le rose clair évoque la tendresse, tandis que le rose foncé exprime une reconnaissance profonde.</p>

        <blockquote>
          "La rose parle toutes les langues d'amour connues du cœur humain." - Dorothy Parker
        </blockquote>

        <h2>Roses Jaunes : L'Amitié</h2>
        <p>Contrairement à ce qu'on pourrait croire, les roses jaunes ne sont pas un mauvais présage ! Elles symbolisent l'amitié joyeuse, la joie de vivre et l'optimisme.</p>

        <h2>Roses Orange : L'Enthousiasme</h2>
        <p>Énergiques et vibrantes, elles expriment l'enthousiasme, le désir et la fascination. Un excellent choix pour féliciter quelqu'un ou célébrer un succès.</p>

        <h2>Roses Violettes : Le Mystère</h2>
        <p>Rares et envoûtantes, les roses violettes représentent le coup de foudre, l'enchantement et le mystère. Elles sont parfaites pour exprimer une admiration profonde.</p>

        <h2>Roses Noires : La Fin d'un Cycle</h2>
        <p>En réalité d'un rouge très foncé, elles symbolisent la fin d'une relation ou d'une période. Utilisées avec tact, elles peuvent aussi représenter un nouveau départ.</p>

        <h2>Associations de couleurs</h2>
        <ul>
          <li><strong>Rouge + Blanc :</strong> Unité et harmonie</li>
          <li><strong>Rose + Jaune :</strong> Amitié amoureuse</li>
          <li><strong>Orange + Rose :</strong> Célébration joyeuse</li>
        </ul>

        <p>Maintenant que vous connaissez le langage des roses, vous pouvez choisir la couleur parfaite pour transmettre exactement le message que vous souhaitez !</p>
      `,
  },
  {
    title: 'Les tendances florales 2026',
    excerpt: 'Fleurs séchées, compositions XXL, couleurs terracotta...',
    category: 'Actualités',
    imageUrl: '/floresia-app/blog/blog-tendances.png',
    readTime: '6 min',
    displayAuthorName: 'Marie Dubois',
    displayAuthorBio: 'Fleuriste passionnée depuis 15 ans',
    createdAt: '2026-02-01T09:00:00.000Z',
    content: `
        <p>L'univers floral évolue constamment et 2026 s'annonce comme une année riche en nouveautés ! Entre retour à la nature et audace créative, découvrez les tendances qui vont transformer nos intérieurs.</p>

        <h2>1. Le grand retour des fleurs séchées</h2>
        <p>Les fleurs séchées continuent leur ascension fulgurante. Pampas, eucalyptus, immortelles... Ces compositions durables séduisent par leur côté bohème et écologique.</p>
        
        <p><strong>Pourquoi c'est tendance :</strong> Zéro entretien, durabilité, esthétique naturelle et prix abordable sur le long terme.</p>

        <h2>2. Les tons terracotta et terre cuite</h2>
        <p>Exit le total blanc ! 2026 mise sur les couleurs chaudes : terracotta, rouille, caramel et tons terre. Ces teintes s'harmonisent parfaitement avec le mobilier naturel.</p>

        <blockquote>
          "Les couleurs chaudes apportent une sensation de cocooning et de sérénité, parfaites pour créer un havre de paix chez soi."
        </blockquote>

        <h2>3. Les compositions XXL spectaculaires</h2>
        <p>On voit grand en 2026 ! Les arrangements floraux surdimensionnés font leur entrée dans nos salons. Branches de cerisier japonais, magnolias géants, ou compositions de deux mètres de haut...</p>

        <h2>4. Le minimalisme japonais</h2>
        <p>L'art de l'ikebana inspire fortement les tendances 2026. Moins c'est plus : une seule branche, quelques fleurs soigneusement choisies, dans un vase épuré.</p>

        <h2>Les couleurs phares 2026</h2>
        <ul>
          <li><strong>Terracotta</strong> : La star absolue de l'année</li>
          <li><strong>Vert sauge</strong> : Apaisant et raffiné</li>
          <li><strong>Bleu nuit</strong> : Pour les ambiances dramatiques</li>
          <li><strong>Blanc crème</strong> : L'indémodable, toujours élégant</li>
        </ul>

        <p>Ces tendances reflètent notre besoin de nature, d'authenticité et de durabilité. N'hésitez pas à mixer plusieurs styles pour créer votre propre univers floral !</p>
      `,
  },
  {
    title: 'DIY : Créer une couronne de fleurs séchées',
    excerpt: 'Un tutoriel pas à pas pour réaliser votre propre couronne.',
    category: 'Tutos',
    imageUrl: '/floresia-app/blog/blog-diy.png',
    readTime: '8 min',
    displayAuthorName: 'Sophie Laurent',
    displayAuthorBio: 'Experte en art floral',
    createdAt: '2026-01-28T09:00:00.000Z',
    content: `
        <p>Créer sa propre couronne de fleurs séchées est plus simple qu'il n'y paraît ! Suivez ce tutoriel pas à pas pour réaliser une décoration murale bohème et durable.</p>

        <h2>Matériel nécessaire</h2>
        <ul>
          <li>Un cercle en osier ou fil de fer (diamètre 30-40 cm)</li>
          <li>Fleurs séchées : pampa, eucalyptus, lavande, immortelles</li>
          <li>Fil de fer fin</li>
          <li>Ciseaux</li>
          <li>Ruban (optionnel)</li>
        </ul>

        <h2>Étape 1 : Préparer votre base</h2>
        <p>Commencez par préparer votre cercle. Si vous utilisez du fil de fer, formez un cercle et fixez les extrémités solidement. L'osier est plus facile à manipuler pour les débutants.</p>

        <h2>Étape 2 : Créer des petits bouquets</h2>
        <p>Assemblez de petits bouquets de 5-7 tiges. Variez les textures : pampas duveteux, eucalyptus fin, immortelles colorées. Fixez chaque bouquet avec du fil de fer.</p>

        <blockquote>
          "La clé d'une belle couronne réside dans la diversité des textures et des hauteurs. N'ayez pas peur de mélanger les styles !"
        </blockquote>

        <h2>Étape 3 : Fixer les bouquets sur le cercle</h2>
        <p>Attachez vos petits bouquets sur le cercle en les faisant se chevaucher légèrement. Travaillez dans le même sens pour un résultat harmonieux.</p>

        <h2>Conseils de conservation</h2>
        <ul>
          <li>Évitez l'humidité et la lumière directe du soleil</li>
          <li>Dépoussiérez délicatement avec un plumeau</li>
          <li>Votre couronne peut durer plusieurs années !</li>
        </ul>

        <p>Votre couronne DIY est terminée ! Elle apportera une touche bohème et naturelle à votre décoration tout en étant 100% durable.</p>
      `,
  },
  {
    title: 'Quelles fleurs offrir pour la Saint-Valentin ?',
    excerpt: 'Au-delà des roses rouges classiques, découvrez des alternatives romantiques.',
    category: 'Conseils',
    imageUrl: '/floresia-app/blog/blog-valentine.png',
    readTime: '4 min',
    displayAuthorName: 'Emma Martin',
    displayAuthorBio: 'Spécialiste en symbolique florale',
    createdAt: '2026-01-25T09:00:00.000Z',
    content: `
        <p>La Saint-Valentin approche et vous cherchez l'alternative parfaite aux traditionnelles roses rouges ? Découvrez nos suggestions originales pour déclarer votre flamme avec style !</p>

        <h2>1. Les pivoines : la reine romantique</h2>
        <p>Volumineuses et délicates, les pivoines roses ou blanches incarnent le romantisme absolu. Leur parfum subtil et leurs pétales soyeux en font un choix exceptionnel.</p>

        <p><strong>Message :</strong> Amour sincère et prospérité du couple</p>

        <h2>2. Les renoncules : l'élégance en bouquet</h2>
        <p>Ces fleurs aux pétales papier froissé offrent une palette de couleurs romantiques. Les renoncules roses pâles ou fuchsia sont particulièrement tendres.</p>

        <blockquote>
          "Les renoncules symbolisent le charme radieux de l'être aimé. Un message subtil et raffiné."
        </blockquote>

        <h2>3. Les tulipes : la déclaration discrète</h2>
        <p>Les tulipes roses ou violettes sont parfaites pour une déclaration douce. Moins démonstrative que la rose rouge, elles expriment un amour profond et respectueux.</p>

        <h2>Notre sélection par budget</h2>
        <ul>
          <li><strong>Petit budget (30-40€)</strong> : Bouquet de tulipes multicolores</li>
          <li><strong>Budget moyen (45-60€)</strong> : Renoncules et roses mélangées</li>
          <li><strong>Sans limite (70€+)</strong> : Composition pivoines premium</li>
        </ul>

        <p>Cette année, surprenez votre moitié avec un bouquet original qui sort des sentiers battus tout en restant profondément romantique.</p>
      `,
  },
  {
    title: "L'art de composer un bouquet harmonieux",
    excerpt: "Les règles d'or pour créer des compositions florales équilibrées.",
    category: 'Tutos',
    imageUrl: '/floresia-app/blog/blog-composition.png',
    readTime: '7 min',
    displayAuthorName: 'Marie Dubois',
    displayAuthorBio: 'Fleuriste passionnée depuis 15 ans',
    createdAt: '2026-01-20T09:00:00.000Z',
    content: `
        <p>Composer un bouquet harmonieux est un art accessible à tous ! Voici les règles d'or pour créer des arrangements floraux équilibrés.</p>

        <h2>La règle des tiers</h2>
        <p>Un bouquet réussi respecte les proportions 3-2-1 : 3 types de fleurs principales, 2 types de feuillages, 1 élément de remplissage (gypsophile, etc.).</p>

        <h2>Jouer avec les hauteurs</h2>
        <p>Variez les hauteurs pour créer du dynamisme. Les fleurs les plus hautes au centre, les plus courtes sur les côtés.</p>

        <blockquote>
          "Un bon bouquet raconte une histoire à travers ses textures, ses couleurs et ses formes."
        </blockquote>

        <h2>Les formes de bouquets</h2>
        <ul>
          <li><strong>Rond</strong> : Classique et équilibré</li>
          <li><strong>Cascade</strong> : Romantique pour mariages</li>
          <li><strong>Asymétrique</strong> : Moderne et tendance</li>
        </ul>

        <p>Avec ces règles en tête, vous êtes prêt à créer des compositions dignes d'un fleuriste professionnel !</p>
      `,
  },
  {
    title: 'Fleurs comestibles : lesquelles choisir ?',
    excerpt: 'Capucines, pensées, violettes... Découvrez quelles fleurs peuvent sublimer vos plats.',
    category: 'Conseils',
    imageUrl: '/floresia-app/blog/blog-comestibles.png',
    readTime: '5 min',
    displayAuthorName: 'Sophie Laurent',
    displayAuthorBio: 'Experte en art floral',
    createdAt: '2026-01-15T09:00:00.000Z',
    content: `
        <p>Les fleurs ne servent pas qu'à décorer ! Découvrez quelles fleurs peuvent sublimer vos plats et pâtisseries en toute sécurité.</p>

        <h2>Règle n°1 : Sécurité avant tout</h2>
        <p>Toutes les fleurs ne sont PAS comestibles ! Consommez uniquement des fleurs cultivées sans pesticides et identifiées avec certitude.</p>

        <h2>Les fleurs comestibles stars</h2>
        <ul>
          <li><strong>Capucines</strong> : Saveur poivrée proche du cresson</li>
          <li><strong>Pensées et violettes</strong> : Douces et légèrement sucrées</li>
          <li><strong>Hibiscus</strong> : Acidulé et fruité</li>
        </ul>

        <blockquote>
          "Les fleurs comestibles transforment un plat ordinaire en œuvre d'art culinaire."
        </blockquote>

        <p>Les fleurs comestibles apportent couleur, saveur et originalité à votre cuisine. Lancez-vous avec prudence et créativité !</p>
      `,
  },
  {
    title: 'Décorer sa table de mariage avec des fleurs',
    excerpt: 'Centres de table, arches florales, bouquets suspendus...',
    category: 'Déco',
    imageUrl: '/floresia-app/blog/blog-mariage.png',
    readTime: '6 min',
    displayAuthorName: 'Emma Martin',
    displayAuthorBio: 'Spécialiste en symbolique florale',
    createdAt: '2026-01-10T09:00:00.000Z',
    content: `
        <p>Les fleurs sont l'âme d'une décoration de mariage. Découvrez toutes nos idées pour créer une ambiance florale inoubliable.</p>

        <h2>1. Le bouquet de mariée</h2>
        <p>Pièce maîtresse de votre look, il doit s'harmoniser avec votre robe et le thème du mariage. Rond et classique, retombant romantique, ou asymétrique moderne ?</p>

        <h2>2. Les centres de table</h2>
        <p>Optez pour des hauteurs variées : compositions hautes sur pied pour certaines tables, arrangements bas et généreux pour d'autres.</p>

        <blockquote>
          "Une décoration florale réussie raconte l'histoire d'amour du couple à travers les couleurs et les formes."
        </blockquote>

        <h2>Styles de décoration</h2>
        <ul>
          <li><strong>Champêtre chic</strong> : Pivoines, roses anciennes, eucalyptus</li>
          <li><strong>Romantique</strong> : Roses, hortensias, tons pastels</li>
          <li><strong>Bohème</strong> : Pampas, fleurs séchées, tons terracotta</li>
        </ul>

        <p>Avec une décoration florale bien pensée, votre mariage restera gravé dans les mémoires !</p>
      `,
  },
];

async function seed() {
  for (const article of articles) {
    const res = await fetch(`${API_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(article),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`❌ Échec pour "${article.title}":`, data.message);
    } else {
      console.log(`✅ Créé : ${data.title} (id: ${data.id})`);
    }
  }
}

seed();