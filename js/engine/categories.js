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
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const LEVELS = 10;

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id);

// Valeur d'une question : 10 points par niveau ; une interception rapporte le double.
export const pointsFor = (level) => level * 10;
