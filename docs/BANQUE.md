# Banque de questions — schéma et charte éditoriale

La banque est entièrement générée et contrôlée **avant** l'installation. Aucune génération
ni aucun appel réseau n'a lieu pendant une partie.

- Un fichier par thème : `data/questions/<categorie>.json`.
- 18 thèmes, 10 niveaux de difficulté par thème, **8 questions par niveau** (au moins 4), tirées au hasard à chaque partie.
- Les joueurs choisissent les thèmes de leur partie (les 10 thèmes « classiques » par défaut).
- Contrôle : `node tools/verifier.mjs` (ou `tools/verifier.html` dans un navigateur).

## Structure d'un fichier

```json
{
  "categorie": "geographie",
  "questions": [ { "...": "..." } ]
}
```

## Structure d'une question

```json
{
  "id": "geo-07-1",
  "categorie": "geographie",
  "niveau": 7,
  "question": "Quelle ville est la capitale fédérale de l'Australie ?",
  "reponse": "Canberra",
  "variantes": [],
  "validation": { "type": "texte", "pieges": ["Sydney", "Melbourne"] },
  "explication": "Canberra a été choisie au début du XXe siècle pour départager Sydney et Melbourne, les deux grandes rivales. Contrairement à elles, c'est une ville planifiée, dessinée par les architectes américains Walter Burley Griffin et Marion Mahony Griffin, et conçue dès l'origine pour accueillir les institutions nationales. Le Parlement s'y est installé en 1927.",
  "anecdote": "Son plan s'organise autour d'un lac artificiel, baptisé du nom de l'architecte : le lac Burley Griffin.",
  "source": "Wikipédia (fr) — « Canberra »",
  "verification": { "statut": "relue", "note": "" }
}
```

| Champ | Obligatoire | Rôle |
|---|---|---|
| `id` | oui | Identifiant unique : `<préfixe>-<niveau sur 2 chiffres>-<n>` (ex. `geo-07-1`). |
| `categorie` | oui | Identifiant du thème (voir tableau des thèmes). |
| `niveau` | oui | Difficulté de 1 (très facile) à 10 (expert). |
| `question` | oui | Énoncé, terminé par « ? ». |
| `reponse` | oui | Réponse principale, telle qu'elle sera affichée. |
| `variantes` | oui (peut être vide) | Autres formulations **acceptées** : synonymes, sigles, noms officiels ou étrangers, graphies reconnues. |
| `validation` | oui | Règles particulières de validation (voir plus bas). |
| `explication` | oui | Carte « Le saviez-vous ? » : **40 à 80 mots**. |
| `anecdote` | non | Fait surprenant complémentaire, 35 mots maximum, distinct de l'explication. |
| `source` | oui si disponible | Référence où vérifier l'information (titre d'article d'encyclopédie, ouvrage…). Jamais d'URL inventée. |
| `verification` | oui | Statut de qualité (voir plus bas). |

### Thèmes et préfixes

| `categorie` | Nom affiché | Préfixe |
|---|---|---|
| `sport` | Sport | `spo` |
| `histoire` | Histoire | `his` |
| `geographie` | Géographie | `geo` |
| `sciences` | Sciences et nature | `sci` |
| `litterature` | Littérature | `lit` |
| `cinema` | Cinéma et séries | `cin` |
| `musique` | Musique | `mus` |
| `internet` | Internet et culture web | `web` |
| `religions` | Religions et mythologies | `rel` |
| `art` | Art et culture générale | `art` |
| `gastronomie` | Gastronomie | `gas` |
| `langue` | Langue française | `lan` |
| `animaux` | Animaux | `ani` |
| `bd` | BD et mangas | `bdm` |
| `jeux` | Jeux vidéo et de société | `jeu` |
| `inventions` | Inventions et techniques | `inv` |
| `television` | Télévision et médias | `tel` |
| `marques` | Marques et économie | `mar` |

Les 10 premiers thèmes sont les thèmes « classiques ». Pour éviter les doublons entre thèmes voisins :
la gastronomie, la langue française et la bande dessinée relèvent désormais de leurs propres thèmes
(et plus de « Art et culture générale ») ; les jeux vidéo relèvent de « Jeux vidéo et de société »
(et plus de « Internet et culture web ») ; les animaux de « Animaux » (« Sciences et nature » garde
la biologie générale, les plantes, l'écologie) ; la télévision de « Télévision et médias »
(« Cinéma et séries » garde le cinéma et les séries).

## Règles de validation (`validation`)

Le moteur gère **automatiquement** et il est donc inutile de les lister en variantes :
la casse, les accents, la ponctuation, les tirets, les apostrophes, les espaces, les articles en tête
(« la », « l' », « les », « the »…), les formules comme « c'est… », les ordinaux et chiffres romains
(« Napoléon Ier » = « Napoléon 1er », « XIXe siècle » = « 19e siècle », « Seconde » = « Deuxième »),
ainsi que les fautes de frappe légères (seuils prudents selon la longueur du mot).

| Clé | Valeurs | Effet |
|---|---|---|
| `type` | `"texte"` (défaut), `"personne"`, `"nombre"` | Mode de comparaison. |
| `pieges` | liste de chaînes | Réponses **fausses** mais plausibles ou proches à l'écrit (Sydney pour Canberra, Autriche pour Australie, Pierre Curie pour Marie Curie). Elles sont toujours refusées et empêchent une acceptation « par ressemblance ». |
| `exact` | `true` | Aucune tolérance aux fautes (symboles chimiques, sigles, réponses très courtes où une lettre change tout). |
| `nom` | chaîne | (`personne`) Nom de famille à accepter seul, s'il n'est pas le dernier mot de la réponse (ex. `"de Gaulle"`, `"Vinci"`). |
| `prenom` | chaîne | (`personne`) Prénom, s'il n'est pas le premier mot. |
| `nomSeul` | `false` | (`personne`) Le nom de famille seul ne suffit pas, car la question le rend ambigu (Pierre / Marie Curie, Johann Strauss père / fils…). Le joueur est alors invité à préciser. |
| `prenomSeul` | `true` | (`personne`) Le prénom seul suffit, car il identifie sans ambiguïté la personnalité dans le contexte de la question. |
| `valeur` | nombre | (`nombre`) Valeur attendue ; la saisie peut être en chiffres ou en lettres. |
| `tolerance` | nombre | (`nombre`) Écart accepté (0 par défaut, toujours 0 pour une année). |

Type `personne` : par défaut, le nom de famille seul est accepté (Einstein, Curie, Hugo), ainsi que
« Prénom Nom » et « Nom Prénom ». Pour un nom unique (Molière, Voltaire, Rembrandt), utiliser `texte`.

## Charte éditoriale

### Questions
- Une seule bonne réponse, vérifiable, sans ambiguïté. Jamais de « Citez un… » ni de réponse multiple.
- Réponse courte, facile à taper sur un téléphone : 1 à 4 mots, ou un nombre.
- La réponse n'apparaît pas dans l'énoncé.
- Pas deux fois la même question ni le même fait dans un thème.
- Formulations variées (« Quel… », « Comment s'appelle… », « Dans quel pays… », « En quelle année… »).
- **Questions sensibles au temps : formulation datée.** « En 2024, quel pays… ? » plutôt que
  « Actuellement, quel pays… ? ». Mots interdits sans date : actuellement, aujourd'hui, en ce moment, récemment, le plus récent.
- Ton respectueux, en particulier pour les religions : factuel, sans jugement, en couvrant plusieurs traditions.

### Échelle de difficulté
| Niveaux | Public visé |
|---|---|
| 1–2 | Très facile : connu de presque tout le monde, dès 12 ans. |
| 3–4 | Facile : culture générale courante. |
| 5–6 | Moyen : amateur curieux. |
| 7–8 | Difficile : très bonne culture générale. |
| 9–10 | Expert : passionné du thème, mais réponse toujours précise et vérifiable (pas d'anecdote obscure invérifiable). |

### Explications « Le saviez-vous ? »
- **40 à 80 mots**, en français naturel, adaptées à la difficulté.
- Intéressantes même pour qui connaissait la réponse : du contexte, pas une reformulation.
- Une date, un chiffre, une cause historique ou une anecdote quand c'est utile.
- **Aucun détail inventé ou incertain.** Dans le doute, on retire le détail.
- Pas de formules répétitives ni artificielles (« Saviez-vous que… », « Fait fascinant… », « Il est intéressant de noter… »).

### Statuts de vérification (`verification.statut`)
| Statut | Sens |
|---|---|
| `a_verifier` | Générée, pas encore relue. |
| `relue` | Relue par une seconde passe indépendante (IA) : faits, ambiguïtés, variantes. **Pas** une vérification humaine. |
| `verifiee` | Vérifiée par une personne à partir de la source indiquée. |

On ne présente jamais comme `verifiee` une information qui ne l'a pas été.
