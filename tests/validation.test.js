// Validation des réponses : fautes, synonymes, noms propres et faux positifs.

import { test, eq } from './harness.js';
import { validate, buildContext } from '../js/engine/validation.js';
import { normalize } from '../js/engine/text.js';
import { damerau } from '../js/engine/distance.js';
import { readNumbers } from '../js/engine/numbers.js';
import { LEXIQUE, PERSONNES } from '../js/engine/lexique.js';

const Q = {
  napoleon: { reponse: 'Napoléon Bonaparte', variantes: ['Napoléon Ier'], validation: { type: 'personne', prenomSeul: true, pieges: ['Napoléon III'] } },
  einstein: { reponse: 'Albert Einstein', variantes: [], validation: { type: 'personne' } },
  shakespeare: { reponse: 'William Shakespeare', variantes: [], validation: { type: 'personne' } },
  constantinople: { reponse: 'Constantinople', variantes: ['Byzance'], validation: { pieges: ['Istanbul'] } },
  photosynthese: { reponse: 'Photosynthèse', variantes: [], validation: {} },
  canberra: { reponse: 'Canberra', variantes: [], validation: { pieges: ['Sydney', 'Melbourne'] } },
  australie: { reponse: 'Australie', variantes: [], validation: {} },
  iran: { reponse: 'Iran', variantes: [], validation: {} },
  slovenie: { reponse: 'Slovénie', variantes: [], validation: {} },
  curieAmbigu: { reponse: 'Marie Curie', variantes: ['Maria Skłodowska-Curie'], validation: { type: 'personne', nomSeul: false, pieges: ['Pierre Curie'] } },
  curie: { reponse: 'Marie Curie', variantes: [], validation: { type: 'personne' } },
  hugo: { reponse: 'Victor Hugo', variantes: [], validation: { type: 'personne' } },
  newton: { reponse: 'Isaac Newton', variantes: [], validation: { type: 'personne' } },
  gaulle: { reponse: 'Charles de Gaulle', variantes: [], validation: { type: 'personne', nom: 'de Gaulle' } },
  usa: { reponse: 'États-Unis', variantes: ['USA', 'United States', "États-Unis d'Amérique"], validation: {} },
  uk: { reponse: 'Royaume-Uni', variantes: ['UK', 'United Kingdom'], validation: {} },
  co2: { reponse: 'Dioxyde de carbone', variantes: ['CO₂', 'gaz carbonique'], validation: {} },
  guerre: { reponse: 'Seconde Guerre mondiale', variantes: [], validation: {} },
  seine: { reponse: 'Seine', variantes: [], validation: {} },
  exupery: { reponse: 'Antoine de Saint-Exupéry', variantes: [], validation: { type: 'personne', nom: 'Saint-Exupéry' } },
  louis: { reponse: 'Louis XIV', variantes: ['Roi-Soleil'], validation: {} },
  siecle: { reponse: 'XIXe siècle', variantes: [], validation: {} },
  waterloo: { reponse: '1815', variantes: [], validation: { type: 'nombre', valeur: 1815 } },
  tungstene: { reponse: 'Tungstène', variantes: ['Wolfram'], validation: {} },
  symboleW: { reponse: 'W', variantes: [], validation: { exact: true } },
  apollo: { reponse: 'Apollo 11', variantes: [], validation: {} },
  fusion: { reponse: '3 422 °C', variantes: [], validation: { type: 'nombre', valeur: 3422, tolerance: 10 } },
  or: { reponse: 'Or', variantes: [], validation: {} },
  mozart: { reponse: 'Wolfgang Amadeus Mozart', variantes: [], validation: { type: 'personne' } },
};

const ctx = buildContext(Object.values(Q), LEXIQUE, PERSONNES);
const v = (q, input) => validate(Q[q], input, ctx).verdict;

function cases(title, q, list) {
  test(title, () => {
    for (const [input, expected] of list) eq(v(q, input), expected, `« ${input} »`);
  });
}

// --- Tableau du cahier des charges
cases('Napoléon Bonaparte : prénom, nom, faute', 'napoleon', [
  ['Napoleon', 'correct'],
  ['Bonaparte', 'correct'],
  ['Bonnaparte', 'correct'],
  ['Napoléon 1er', 'correct'],
  ['napoleon bonaparte', 'correct'],
  ['Napoléon III', 'incorrect'],
]);
cases('Albert Einstein : inversion de lettres', 'einstein', [
  ['Einstien', 'correct'],
  ['Einstein', 'correct'],
  ['albert einstien', 'correct'],
  ['Einstein Albert', 'correct'],
]);
cases('William Shakespeare : lettre manquante', 'shakespeare', [
  ['Shakespear', 'correct'],
  ['Shakespeare', 'correct'],
]);
cases('Constantinople : faute légère, synonyme, piège', 'constantinople', [
  ['Constentinople', 'correct'],
  ['Byzance', 'correct'],
  ['Istanbul', 'incorrect'],
]);
cases('Photosynthèse : accents', 'photosynthese', [['Photosynthese', 'correct'], ['PHOTOSYNTHÈSE', 'correct']]);
cases('Canberra : Sydney refusée', 'canberra', [
  ['Sydney', 'incorrect'],
  ['Melbourne', 'incorrect'],
  ['canbera', 'correct'],
  ['  CANBERRA  ', 'correct'],
]);

// --- Faux positifs : ressembler ne suffit pas
cases('Australie : Autriche refusée', 'australie', [
  ['Autriche', 'incorrect'],
  ['Australi', 'correct'],
  ["l'Australie", 'correct'],
]);
cases('Iran : Irak refusé', 'iran', [['Irak', 'incorrect'], ['Iran', 'correct'], ['Iran ou Irak', 'douteux']]);
cases('Slovénie : saisie à mi-chemin de la Slovaquie → arbitrage', 'slovenie', [
  ['Slovakie', 'douteux'],
  ['Slovaquie', 'incorrect'],
  ['Slovenie', 'correct'],
]);
cases('Or : aucun écart toléré sur un mot très court', 'or', [['Ar', 'incorrect'], ['or', 'correct']]);
cases('Apollo 11 : un chiffre différent n’est jamais une faute de frappe', 'apollo', [
  ['Apollo 12', 'incorrect'],
  ['apollo11', 'correct'],
]);
cases('Symbole W : correspondance exacte', 'symboleW', [['w', 'correct'], ['V', 'incorrect'], ['Wo', 'incorrect']]);

// --- Noms de personnes
cases('Nom de famille seul accepté', 'hugo', [['Hugo', 'correct'], ['Victor Hugo', 'correct'], ['Victor', 'incorrect']]);
cases('Newton, Mozart : nom seul et fautes', 'newton', [['Newton', 'correct'], ['Newtonn', 'correct']]);
cases('Mozart : prénoms multiples', 'mozart', [['Mozart', 'correct'], ['Wolfgang Amadeus Mozart', 'correct'], ['Mozar', 'correct']]);
cases('Curie (question non ambiguë) : nom seul accepté', 'curie', [['Curie', 'correct']]);
cases('Curie (Pierre ou Marie ?) : précision exigée', 'curieAmbigu', [
  ['Curie', 'imprecis'],
  ['Curi', 'imprecis'],
  ['Marie Curie', 'correct'],
  ['Pierre Curie', 'incorrect'],
  ['Maria Sklodowska-Curie', 'correct'],
]);
cases('De Gaulle : particule', 'gaulle', [['de Gaulle', 'correct'], ['Gaulle', 'correct'], ['Charles de Gaule', 'correct']]);
cases('Saint-Exupéry : tirets et accents', 'exupery', [['saint exupery', 'correct'], ['Saint Exupery', 'correct'], ['saintexupery', 'correct']]);

// --- Synonymes et équivalences
cases('États-Unis / USA / United States', 'usa', [
  ['USA', 'correct'],
  ['united states', 'correct'],
  ['Etats Unis', 'correct'],
  ['les États-Unis', 'correct'],
  ['Etats-Unis d Amerique', 'correct'],
]);
cases('Royaume-Uni / UK / United Kingdom', 'uk', [['UK', 'correct'], ['royaume uni', 'correct'], ['United Kingdom', 'correct']]);
cases('Dioxyde de carbone / CO₂ / gaz carbonique', 'co2', [['CO2', 'correct'], ['co₂', 'correct'], ['gaz carbonique', 'correct'], ['le dioxyde de carbone', 'correct']]);
cases('Seconde / Deuxième Guerre mondiale', 'guerre', [
  ['Deuxième Guerre mondiale', 'correct'],
  ['2e guerre mondiale', 'correct'],
  ['seconde guerre mondiale', 'correct'],
  ['Guerre mondiale', 'douteux'],
  ['Première Guerre mondiale', 'incorrect'],
]);
cases('Ordinaux et chiffres romains', 'louis', [['Louis 14', 'correct'], ['louis XIV', 'correct'], ['Louis XV', 'incorrect'], ['Roi Soleil', 'correct']]);
cases('Siècles', 'siecle', [['19e siècle', 'correct'], ['XIXème siècle', 'correct'], ['XVIIIe siècle', 'incorrect']]);
cases('Articles et formules', 'seine', [['la Seine', 'correct'], ["c'est la Seine", 'correct'], ['Seine', 'correct']]);
cases('Réponse noyée dans une phrase → arbitrage', 'canberra', [['bien sûr Canberra évidemment', 'douteux']]);
cases('Première lettre changée → arbitrage', 'canberra', [['Kanberra', 'douteux']]);
cases('Saisie vide', 'canberra', [['', 'incorrect'], ['   ', 'incorrect']]);

// --- Nombres
cases('Années', 'waterloo', [
  ['1815', 'correct'],
  ['en 1815', 'correct'],
  ['1814', 'incorrect'],
  ['mille huit cent quinze', 'correct'],
  ['1814 ou 1815', 'douteux'],
]);
cases('Mesures avec tolérance', 'fusion', [['3422', 'correct'], ['3 422 degrés', 'correct'], ['3 430', 'correct'], ['3500', 'incorrect']]);
cases('Synonymes de sens précis', 'tungstene', [['wolfram', 'correct'], ['tungstene', 'correct'], ['titane', 'incorrect']]);

// --- Briques de base
test('Normalisation', () => {
  eq(normalize("  L'Œuvre — Saint-Exupéry  "), 'l oeuvre saint exupery');
  eq(normalize('Napoléon Ier'), 'napoleon 1');
  eq(normalize('XIXe siècle'), '19 siecle');
  eq(normalize('V pour Vendetta'), 'v pour vendetta');
  eq(normalize('La Vie en rose'), 'la vie en rose');
});
test('Distance de Damerau-Levenshtein', () => {
  eq(damerau('einstein', 'einstien'), 1);
  eq(damerau('bonaparte', 'bonnaparte'), 1);
  eq(damerau('kitten', 'sitting'), 3);
  eq(damerau('', 'abc'), 3);
});
test('Lecture des nombres', () => {
  eq(readNumbers('3 422'), [3422]);
  eq(readNumbers('quatre-vingt-dix-neuf'), [99]);
  eq(readNumbers('deux mille vingt-quatre'), [2024]);
  eq(readNumbers('3,5'), [3.5]);
});
