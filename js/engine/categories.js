// Les 10 thèmes de Culturisk, leur couleur stable pendant toute la partie et leur pictogramme.

export const CATEGORIES = [
  { id: 'sport', nom: 'Sport', court: 'Sport', couleur: '#ff4d4f', encre: '#2a0608', icone: 'sport' },
  { id: 'histoire', nom: 'Histoire', court: 'Histoire', couleur: '#d9965b', encre: '#2b1606', icone: 'histoire' },
  { id: 'geographie', nom: 'Géographie', court: 'Géo', couleur: '#3aa6ff', encre: '#04182b', icone: 'geographie' },
  { id: 'sciences', nom: 'Sciences et nature', court: 'Sciences', couleur: '#22c98a', encre: '#03241a', icone: 'sciences' },
  { id: 'litterature', nom: 'Littérature', court: 'Littérature', couleur: '#b06cff', encre: '#1e0838', icone: 'litterature' },
  { id: 'cinema', nom: 'Cinéma et séries', court: 'Cinéma', couleur: '#ff4fa3', encre: '#2e0619', icone: 'cinema' },
  { id: 'musique', nom: 'Musique', court: 'Musique', couleur: '#ffd23f', encre: '#2b2100', icone: 'musique' },
  { id: 'internet', nom: 'Internet et culture web', court: 'Web', couleur: '#2fe0f0', encre: '#022529', icone: 'internet' },
  { id: 'religions', nom: 'Religions et mythologies', court: 'Mythes', couleur: '#6f7bff', encre: '#0b0f3a', icone: 'religions' },
  { id: 'art', nom: 'Art et culture générale', court: 'Art', couleur: '#ff8a3d', encre: '#2e1203', icone: 'art' },
  { id: 'gastronomie', nom: 'Gastronomie', court: 'Gastro', couleur: '#ff7a6b', encre: '#2e0b06', icone: 'gastronomie' },
  { id: 'langue', nom: 'Langue française', court: 'Langue', couleur: '#efd9a7', encre: '#2b2210', icone: 'langue' },
  { id: 'animaux', nom: 'Animaux', court: 'Animaux', couleur: '#e0b04a', encre: '#2b1e03', icone: 'animaux' },
  { id: 'bd', nom: 'BD et mangas', court: 'BD', couleur: '#ff9ed2', encre: '#33091f', icone: 'bd' },
  { id: 'jeux', nom: 'Jeux vidéo et de société', court: 'Jeux', couleur: '#c6f432', encre: '#1d2602', icone: 'jeux' },
  { id: 'inventions', nom: 'Inventions et techniques', court: 'Inventions', couleur: '#9fb3c8', encre: '#121c26', icone: 'inventions' },
  { id: 'television', nom: 'Télévision et médias', court: 'Télé', couleur: '#e879f9', encre: '#2a0730', icone: 'television' },
  { id: 'marques', nom: 'Marques et économie', court: 'Marques', couleur: '#4fd1c5', encre: '#04221f', icone: 'marques' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
// Les 10 thèmes historiques : sélection par défaut, et ceux du logo.
export const CLASSIQUES = CATEGORY_IDS.slice(0, 10);
export const MIN_CATEGORIES = 3;
export const LEVELS = 10;

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id);

// Valeur d'une question : 10 points par niveau ; une interception rapporte le double.
export const pointsFor = (level) => level * 10;
