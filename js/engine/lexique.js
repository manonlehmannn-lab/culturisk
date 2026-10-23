// Lexique d'entités connues servant de « réponses concurrentes » lors de la validation :
// si la saisie ressemble autant à une autre entité qu'à la bonne réponse, elle n'est pas
// acceptée automatiquement (Autriche ≠ Australie, Iran ≠ Irak, Suède ≠ Suisse…).
// Un tableau regroupe les noms d'une même entité ; ils ne se font jamais concurrence.
// Les réponses de la banque de questions complètent automatiquement ce lexique.

export const PAYS = [
  'Afghanistan', 'Afrique du Sud', 'Albanie', 'Algérie', 'Allemagne', 'Andorre', 'Angola', 'Antigua-et-Barbuda',
  'Arabie saoudite', 'Argentine', 'Arménie', 'Australie', 'Autriche', 'Azerbaïdjan', 'Bahamas', 'Bahreïn',
  'Bangladesh', 'Barbade', 'Belgique', 'Belize', 'Bénin', 'Bhoutan', 'Biélorussie', ['Birmanie', 'Myanmar'],
  'Bolivie', 'Bosnie-Herzégovine', 'Botswana', 'Brésil', 'Brunei', 'Bulgarie', 'Burkina Faso', 'Burundi',
  'Cambodge', 'Cameroun', 'Canada', 'Cap-Vert', 'Centrafrique', 'Chili', 'Chine', 'Chypre', 'Colombie', 'Comores',
  'Congo', ['République démocratique du Congo', 'RDC'], ['Corée du Nord'], ['Corée du Sud'], 'Costa Rica',
  ["Côte d'Ivoire"], 'Croatie', 'Cuba', 'Danemark', 'Djibouti', 'Dominique', 'Égypte', ['Émirats arabes unis', 'EAU'],
  'Équateur', 'Érythrée', 'Espagne', 'Estonie', 'Eswatini', ['États-Unis', 'USA', 'United States'],
  'Éthiopie', 'Fidji', 'Finlande', 'France', 'Gabon', 'Gambie', 'Géorgie', 'Ghana', 'Grèce', 'Grenade',
  'Guatemala', 'Guinée', 'Guinée-Bissau', 'Guinée équatoriale', 'Guyana', 'Haïti', 'Honduras', 'Hongrie',
  'Inde', 'Indonésie', 'Irak', 'Iran', 'Irlande', 'Islande', 'Israël', 'Italie', 'Jamaïque', 'Japon',
  'Jordanie', 'Kazakhstan', 'Kenya', 'Kirghizistan', 'Kiribati', 'Koweït', 'Laos', 'Lesotho', 'Lettonie',
  'Liban', 'Liberia', 'Libye', 'Liechtenstein', 'Lituanie', 'Luxembourg', 'Macédoine du Nord', 'Madagascar',
  'Malaisie', 'Malawi', 'Maldives', 'Mali', 'Malte', 'Maroc', 'Maurice', 'Mauritanie', 'Mexique', 'Micronésie',
  'Moldavie', 'Monaco', 'Mongolie', 'Monténégro', 'Mozambique', 'Namibie', 'Nauru', 'Népal', 'Nicaragua',
  'Niger', 'Nigeria', 'Norvège', 'Nouvelle-Zélande', 'Oman', 'Ouganda', 'Ouzbékistan', 'Pakistan', 'Palaos',
  'Palestine', 'Panama', 'Papouasie-Nouvelle-Guinée', 'Paraguay', ['Pays-Bas', 'Hollande'], 'Pérou',
  'Philippines', 'Pologne', 'Portugal', 'Qatar', 'République dominicaine', ['République tchèque', 'Tchéquie'],
  'Roumanie', ['Royaume-Uni', 'UK', 'United Kingdom', 'Grande-Bretagne'], 'Russie', 'Rwanda',
  'Saint-Marin', 'Sainte-Lucie', 'Salvador', 'Samoa', 'Sénégal', 'Serbie', 'Seychelles', 'Sierra Leone',
  'Singapour', 'Slovaquie', 'Slovénie', 'Somalie', 'Soudan', 'Soudan du Sud', 'Sri Lanka', 'Suède', 'Suisse',
  'Suriname', 'Syrie', 'Tadjikistan', 'Taïwan', 'Tanzanie', 'Tchad', 'Thaïlande', 'Timor oriental', 'Togo',
  'Tonga', 'Trinité-et-Tobago', 'Tunisie', 'Turkménistan', 'Turquie', 'Tuvalu', 'Ukraine', 'Uruguay',
  'Vanuatu', 'Vatican', 'Venezuela', 'Viêt Nam', 'Yémen', 'Zambie', 'Zimbabwe',
  // Territoires et régions souvent confondus
  'Guyane', 'Groenland', 'Écosse', 'Angleterre', 'Pays de Galles', 'Irlande du Nord', 'Tibet', 'Sibérie',
  'Alaska', 'Hawaï', 'Sardaigne', 'Sicile', 'Corse', 'Crète', 'Bali', 'Java', 'Sumatra', 'Bornéo', 'Tasmanie',
];

export const CAPITALES = [
  'Paris', 'Londres', 'Berlin', 'Madrid', 'Rome', 'Lisbonne', 'Bruxelles', 'Amsterdam', 'La Haye', 'Luxembourg',
  'Berne', 'Vienne', 'Prague', 'Bratislava', 'Budapest', 'Varsovie', 'Ljubljana', 'Zagreb', 'Belgrade',
  'Sarajevo', 'Podgorica', 'Skopje', 'Tirana', 'Athènes', 'Sofia', 'Bucarest', 'Chisinau', 'Kiev', 'Minsk',
  'Vilnius', 'Riga', 'Tallinn', 'Helsinki', 'Stockholm', 'Oslo', 'Copenhague', 'Reykjavik', 'Dublin',
  'Édimbourg', 'Moscou', 'Ankara', 'Istanbul', 'Nicosie', 'La Valette', 'Andorre-la-Vieille', 'Saint-Marin',
  'Monaco', 'Vaduz', 'Tbilissi', 'Erevan', 'Bakou', 'Téhéran', 'Bagdad', 'Damas', 'Beyrouth', 'Amman',
  'Jérusalem', 'Tel Aviv', 'Riyad', 'Djeddah', 'Sanaa', 'Mascate', 'Abou Dabi', 'Dubaï', 'Doha', 'Koweït',
  'Manama', 'Kaboul', 'Islamabad', 'Karachi', 'New Delhi', 'Delhi', 'Bombay', 'Calcutta', 'Katmandou',
  'Thimphou', 'Dacca', 'Colombo', 'Malé', 'Naypyidaw', 'Rangoun', 'Bangkok', 'Vientiane', 'Phnom Penh', 'Hanoï',
  'Hô Chi Minh-Ville', 'Kuala Lumpur', 'Singapour', 'Jakarta', 'Manille', 'Dili', ['Pékin', 'Beijing'], 'Shanghai',
  'Hong Kong', 'Taipei', 'Séoul', 'Pyongyang', 'Tokyo', 'Kyoto', 'Osaka', 'Oulan-Bator', 'Astana', 'Almaty',
  'Tachkent', 'Bichkek', 'Douchanbé', 'Achgabat', 'Canberra', 'Sydney', 'Melbourne', 'Wellington', 'Auckland',
  'Ottawa', 'Toronto', 'Montréal', 'Québec', 'Vancouver', 'Washington', 'New York', 'Los Angeles', 'Chicago',
  'Mexico', 'Guatemala', 'San Salvador', 'Tegucigalpa', 'Managua', 'San José', 'Panama', 'La Havane',
  'Kingston', 'Port-au-Prince', 'Saint-Domingue', 'Caracas', 'Bogota', 'Quito', 'Lima', 'La Paz', 'Sucre',
  'Santiago', 'Buenos Aires', 'Montevideo', 'Asuncion', 'Brasilia', 'Rio de Janeiro', 'São Paulo',
  'Georgetown', 'Paramaribo', 'Cayenne', 'Le Caire', 'Alexandrie', 'Tripoli', 'Tunis', 'Alger', 'Rabat',
  'Casablanca', 'Nouakchott', 'Dakar', 'Bamako', 'Niamey', 'Ouagadougou', 'Abidjan', 'Yamoussoukro', 'Accra',
  'Lomé', 'Porto-Novo', 'Cotonou', 'Abuja', 'Lagos', 'Yaoundé', 'Douala', "N'Djamena", 'Khartoum', 'Djouba',
  'Addis-Abeba', 'Asmara', 'Djibouti', 'Mogadiscio', 'Nairobi', 'Kampala', 'Kigali', 'Bujumbura', 'Dodoma',
  'Dar es Salaam', 'Kinshasa', 'Brazzaville', 'Libreville', 'Malabo', 'Bangui', 'Luanda', 'Lusaka', 'Harare',
  'Lilongwe', 'Maputo', 'Antananarivo', 'Port-Louis', 'Windhoek', 'Gaborone', 'Pretoria', 'Le Cap',
  'Johannesburg', 'Maseru', 'Mbabane', 'Conakry', 'Bissau', 'Freetown', 'Monrovia', 'Banjul', 'Praia',
];

export const ASTRES = [
  'Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton', 'Cérès', 'Éris',
  'Soleil', 'Lune', 'Io', 'Europe', 'Ganymède', 'Callisto', 'Titan', 'Encelade', 'Triton', 'Phobos', 'Déimos',
  'Charon', 'Sirius', 'Bételgeuse', 'Véga', 'Polaris', 'Proxima du Centaure', 'Andromède', 'Orion',
];

export const ELEMENTS = [
  'Hydrogène', 'Hélium', 'Lithium', 'Béryllium', 'Bore', 'Carbone', 'Azote', 'Oxygène', 'Fluor', 'Néon',
  'Sodium', 'Magnésium', 'Aluminium', 'Silicium', 'Phosphore', 'Soufre', 'Chlore', 'Argon', 'Potassium',
  'Calcium', 'Scandium', 'Titane', 'Vanadium', 'Chrome', 'Manganèse', 'Fer', 'Cobalt', 'Nickel', 'Cuivre',
  'Zinc', 'Gallium', 'Germanium', 'Arsenic', 'Sélénium', 'Brome', 'Krypton', 'Rubidium', 'Strontium',
  'Yttrium', 'Zirconium', 'Niobium', 'Molybdène', 'Technétium', 'Ruthénium', 'Rhodium', 'Palladium',
  'Argent', 'Cadmium', 'Indium', 'Étain', 'Antimoine', 'Tellure', 'Iode', 'Xénon', 'Césium', 'Baryum',
  'Lanthane', 'Cérium', 'Néodyme', 'Europium', 'Gadolinium', 'Hafnium', 'Tantale', ['Tungstène', 'Wolfram'],
  'Rhénium', 'Osmium', 'Iridium', 'Platine', 'Or', 'Mercure', 'Thallium', 'Plomb', 'Bismuth', 'Polonium',
  'Astate', 'Radon', 'Francium', 'Radium', 'Actinium', 'Thorium', 'Uranium', 'Neptunium', 'Plutonium',
  'Américium', 'Curium', 'Einsteinium', 'Fermium', 'Mendélévium', 'Nobélium',
];

export const DIVERS = [
  'Afrique', 'Amérique du Nord', 'Amérique du Sud', 'Asie', 'Europe', 'Océanie', 'Antarctique', 'Arctique',
  'Atlantique', 'Pacifique', 'océan Indien', 'Méditerranée', 'mer Noire', 'mer Rouge', 'mer Baltique',
  'mer du Nord', 'mer Caspienne', 'Manche', 'Nil', 'Amazone', 'Mississippi', 'Yangzi Jiang', 'Danube', 'Rhin',
  'Rhône', 'Loire', 'Seine', 'Garonne', 'Volga', 'Gange', 'Mékong', 'Tamise', 'Tibre', 'Everest', 'Mont Blanc',
  'Kilimandjaro', 'Aconcagua', 'Alpes', 'Pyrénées', 'Andes', 'Himalaya', 'Rocheuses', 'Oural', 'Sahara',
  'Gobi', 'Kalahari', 'Atacama',
];

// Personnalités homonymes : « Prénom|Nom ». Elles servent à détecter les noms de famille ambigus.
export const PERSONNES = [
  'Pierre|Curie', 'Marie|Curie', 'Irène|Joliot-Curie', 'Frédéric|Joliot-Curie',
  'Johann Sebastian|Bach', 'Carl Philipp Emanuel|Bach', 'Johann Christian|Bach',
  'Johann|Strauss', 'Richard|Strauss', 'Alexandre|Dumas', 'Charlotte|Brontë', 'Emily|Brontë', 'Anne|Brontë',
  'Auguste|Lumière', 'Louis|Lumière', 'Joseph|Montgolfier', 'Étienne|Montgolfier', 'Orville|Wright',
  'Wilbur|Wright', 'Jacob|Grimm', 'Wilhelm|Grimm', 'Thomas|Mann', 'Heinrich|Mann', 'Aldous|Huxley',
  'Julian|Huxley', 'Charles|Darwin', 'Erasmus|Darwin', 'Auguste|Renoir', 'Jean|Renoir', 'Claude|Monet',
  'Édouard|Manet', 'Pieter|Brueghel', 'Jan|Brueghel', 'Edmond|Goncourt', 'Jules|Goncourt', 'Karl|Marx',
  'Groucho|Marx', 'Theodore|Roosevelt', 'Franklin|Roosevelt', 'John|Kennedy', 'Robert|Kennedy',
  'George|Bush', 'Serena|Williams', 'Venus|Williams', 'Michael|Schumacher', 'Ralf|Schumacher',
  'Joel|Coen', 'Ethan|Coen', 'Lana|Wachowski', 'Lilly|Wachowski', 'Jean-Paul|Sartre', 'Louis|Armstrong',
  'Neil|Armstrong', 'Lance|Armstrong', 'Charles|Perrault', 'Claude|Perrault', 'Pierre|Corneille',
  'Thomas|Corneille', 'Henri|Becquerel', 'Antoine|Becquerel', 'Jacques|Prévert', 'Pierre|Prévert',
  'Jean|Racine', 'Louis|Racine', 'Gustave|Flaubert', 'Gustave|Eiffel', 'Gustave|Courbet',
];

export const LEXIQUE = [...PAYS, ...CAPITALES, ...ASTRES, ...ELEMENTS, ...DIVERS];
