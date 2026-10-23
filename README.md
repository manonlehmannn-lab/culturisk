# Culturisk

**Le grand quiz de culture générale où chaque bonne réponse est un pari.**
Deux équipes, un seul iPhone, 10 thèmes, 10 niveaux par thème — et une carte « Le saviez-vous ? »
après chaque question pour repartir plus cultivé qu'on est arrivé.

Application web installable (PWA), **100 % hors ligne** une fois ouverte : aucune API, aucun modèle d'IA
pendant la partie, aucune donnée envoyée.

| | | |
|---|---|---|
| ![Choix du thème](docs/captures/choose.png) | ![Question](docs/captures/ask.png) | ![Le saviez-vous ?](docs/captures/reveal.png) |

## Jouer

- En ligne : **https://manonlehmannn-lab.github.io/culturisk/**
- Sur iPhone : ouvrir le lien dans Safari → bouton Partager → **Sur l'écran d'accueil**.
  L'application se lance alors en plein écran et fonctionne sans réseau.

## Règles

1. À son tour, une équipe choisit un thème et joue son **prochain niveau** : 10 points par niveau
   (niveau 4 = 40 points). Le tableau est commun aux deux équipes.
2. **Bonne réponse** : les points sont acquis et l'équipe continue. Elle peut monter dans le même thème,
   changer de thème — l'ancien est alors **verrouillé jusqu'à la fin du tour** — ou **passer la main**
   pour mettre ses points à l'abri.
3. **Mauvaise réponse** (ou « Je passe ») : l'équipe adverse a un **droit de réponse gratuit**, sans voir
   la solution. Réussi : elle marque **le double**. Raté : personne ne marque. La question est consommée,
   la réponse et son explication sont révélées, puis la main passe.
4. La partie s'arrête après le nombre de manches choisi (3, 5, 8) ou quand les 100 cases sont jouées.

> Le cahier des charges fixe la validation, l'interception, la révélation et la progression par thème.
> Le reste (10 points par niveau, enchaînement tant que l'équipe répond juste, droit de passer la main,
> manches) est un choix de conception, regroupé dans `js/engine/game.js` et `js/engine/categories.js`
> pour être facilement ajusté.

## Validation intelligente des réponses

Le moteur (`js/engine/validation.js`) vérifie que le joueur **connaît** la réponse, sans exiger
une orthographe parfaite :

- normalisation : casse, accents, ponctuation, tirets, apostrophes, espaces, articles (« l'Australie »),
  formules (« c'est… »), ordinaux et chiffres romains (Napoléon Ier = 1er, XIXe = 19e, Seconde = Deuxième) ;
- réponse principale + **variantes acceptées** propres à chaque question (USA, CO2, Wolfram…) ;
- **noms de famille** : « Einstein » suffit, sauf si la question rend le nom ambigu (Pierre ou Marie Curie ?) :
  le joueur est alors invité à préciser ;
- **distance de Damerau-Levenshtein** (inversions comprises) avec des seuils prudents selon la longueur ;
  aucune tolérance sur les mots très courts ni sur les chiffres (Apollo 11 ≠ Apollo 12) ;
- **jamais d'acceptation par simple ressemblance** si une autre réponse plausible est aussi proche :
  pièges déclarés par question + lexique de pays, capitales, astres, éléments, homonymes célèbres
  et toutes les réponses de la banque (Autriche ≠ Australie, Iran ≠ Irak, Sydney ≠ Canberra) ;
- les cas limites partent en **arbitrage** : écran neutre qui ne révèle pas la solution, avis des
  deux équipes, réponse acceptée seulement si elles sont d'accord ; la décision est enregistrée
  avant l'attribution des points ou l'interception.

## La banque de questions

- 400 questions : 10 thèmes × 10 niveaux × 4 questions (tirage aléatoire, en évitant les questions déjà vues).
- Chaque question : identifiant, thème, niveau, énoncé, réponse, variantes, règles de validation, pièges,
  explication de 40 à 80 mots, anecdote facultative, source, statut de vérification.
  Schéma et charte éditoriale : [`docs/BANQUE.md`](docs/BANQUE.md).
- **Statut honnête** : les questions ont été rédigées par IA, puis **relues par une seconde passe IA
  indépendante** (faits, ambiguïtés, variantes, niveaux), qui a corrigé, nuancé ou réécrit 86 d'entre elles.
  Elles sont marquées `relue`, **pas** `verifiee` : aucune n'a encore été vérifiée par une personne
  à partir de sa source. Chaque carte affiche sa source pour permettre ce contrôle.

### Outil de vérification

```sh
node tools/verifier.mjs      # ou ouvrir tools/verifier.html dans un navigateur
```

Il signale : champs manquants, niveaux sous-dotés, réponses ou variantes refusées par le moteur,
**pièges qui seraient acceptés**, explications hors format, formulations sensibles au temps non datées,
réponse présente dans l'énoncé, noms de famille partagés par plusieurs célébrités, réponses trop proches
d'une autre entité, doublons. Il échoue (code 1) en cas d'erreur.

## Tests

```sh
node tests/run.mjs           # ou ouvrir tests/index.html
```

45 tests couvrent les fautes de frappe, synonymes, noms propres, faux positifs, nombres, et tout le
déroulement d'une partie (interception, arbitrage, verrouillage des thèmes, fin de partie).
`tests/e2e.html` joue une partie complète dans le navigateur par de vrais clics.
L'intégration continue GitHub lance les tests et la vérification de la banque à chaque envoi.

## Direction artistique

« Studio 10 » : plateau de quiz télé rétro modernisé, pupitres lumineux, compteurs 7 segments,
tableau de 10 thèmes en échelles lumineuses. Détails, palette, typographies, animations :
[`docs/DIRECTION_ARTISTIQUE.md`](docs/DIRECTION_ARTISTIQUE.md).

## Structure

```
index.html, sw.js, manifest.webmanifest   enveloppe PWA (cache hors ligne)
css/style.css                             direction artistique
js/engine/   validation, texte, distance, nombres, lexique, thèmes, banque, moteur de partie
js/ui/       contrôleur, écrans, composants, sons, vibrations, effets
data/questions/<thème>.json               banque de questions
tools/       vérificateur de la banque, rendu de l'icône
tests/       tests unitaires et partie de bout en bout
```

Aucune dépendance ni étape de compilation : des modules JavaScript servis tels quels.
Pour développer : `python3 -m http.server` à la racine, puis ouvrir http://localhost:8000.

## Licences

Polices : Unbounded et Figtree (SIL Open Font License), DSEG7 (SIL OFL) — voir `assets/fonts/`.
