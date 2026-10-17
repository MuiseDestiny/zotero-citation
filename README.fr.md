# Zotero Citation

<img src="addon/chrome/content/icons/favicon.png" alt="Zotero Citation" width="64">

[English](README.md) | [简体中文](README.zh-CN.md) | [Русский](README.ru.md) | **Français**

[![Dernière version](https://img.shields.io/github/v/release/MuiseDestiny/zotero-citation)](https://github.com/MuiseDestiny/zotero-citation/releases)
[![Licence](https://img.shields.io/github/license/MuiseDestiny/zotero-citation)](LICENSE)

Consultez les références citées dans votre document Word et insérez des citations directement depuis Zotero, par raccourci clavier ou glisser-déposer.

## Fonctionnalités

| Fonction                    | Description                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Collections par document    | Collection temporaire des références citées de la bibliothèque personnelle, pour chaque session Word           |
| Colonne Citation            | Texte des citations : `[1]`, `[1, 2]` ou citations auteur-date                                                 |
| Raccourci clavier           | Insertion dans Word des références sélectionnées avec la touche apostrophe `'` dans Zotero                     |
| Citation pendant la lecture | Citation de la notice parente de la pièce jointe ouverte dans un onglet de lecture                             |
| Glisser-déposer             | Insertion d’une ou plusieurs références de la liste Zotero dans Word                                           |
| Intégration native          | Zotero gère les styles, la fusion des citations adjacentes et les mises à jour, sans collage de texte statique |

## Installation et premiers pas

1. Téléchargez `zotero-citation.xpi` depuis les [Releases](https://github.com/MuiseDestiny/zotero-citation/releases).
2. Dans le gestionnaire de plugins Zotero, choisissez l’installation depuis un fichier dans le menu à roue dentée, puis sélectionnez le XPI.
3. Vérifiez que les commandes natives **Add/Edit Citation** et **Refresh** fonctionnent dans Word.
4. Insérez une citation Zotero ou cliquez sur **Refresh** dans un document contenant déjà des citations.
5. Revenez dans Zotero : la collection temporaire Word apparaît. Activez **Citation** dans le menu des en-têtes de colonnes.

Le manifeste déclare la prise en charge de **Zotero 7 à 11**. L’intégration vise **Microsoft Word pour ordinateur sous Windows et macOS**, et non Word pour le web, WPS ou LibreOffice. Les combinaisons de versions restent à vérifier individuellement.

> Le plugin dépend de l’intégration Word de Zotero et ne remplace pas le complément Word. Sous macOS, la détection du nom peut demander l’autorisation de laisser Zotero contrôler Microsoft Word.

## Utilisation

### Parcourir les références par document

Après création d’une session de citation Word dans Zotero, le plugin ajoute une collection temporaire avec une icône Word dans **Ma bibliothèque** et actualise son contenu à partir des citations.

-   Chaque session dispose de sa collection lorsque plusieurs documents sont utilisés.
-   Le nom provient des métadonnées ; à défaut, un nom comme `Word (1)` est utilisé.
-   Les vérifications suivantes tentent de suivre les changements de nom et « Enregistrer sous ». Les noms modifiés manuellement sont conservés.
-   Les références ne sont pas dupliquées. Seules celles de la bibliothèque personnelle sont ajoutées, pas celles des bibliothèques de groupe.

**Ces collections sont temporaires, pas des listes permanentes.** Le nettoyage intervient à la suppression de la session, à l’arrêt du plugin ou à la fermeture de la fenêtre Zotero. Au démarrage, le plugin tente aussi de supprimer ses collections laissées après un arrêt interrompu. Supprimer une collection ne supprime pas ses références de la bibliothèque.

Pour conserver une liste, ajoutez les références à votre propre collection ordinaire. Renommer une collection temporaire ne la rend pas permanente.

<details>
<summary>Démonstration des collections</summary>

![Collection du document](https://user-images.githubusercontent.com/51939531/218295007-d603f9b8-3147-4cd6-9e7e-c75351889d84.png)

</details>

### Colonne Citation

Activez **Citation** depuis le menu des en-têtes. Une collection du plugin sélectionnée détermine le document affiché ; ailleurs, la session courante de Zotero est utilisée, ou l’unique session Word en l’absence de session courante. Avec plusieurs sessions sans session courante, aucun document n’est deviné. Sans session ou citation pertinente, la cellule reste vide.

Les styles dans le texte affichent le texte fourni par la session, en regroupant les occurrences. **Pour les styles à notes, le numéro correspond actuellement à l’ordre de première apparition de la référence, pas au numéro réel de chaque note Word.** Après suppression ou déplacement de citations dans Word, cliquez sur **Refresh** : la colonne reflète le dernier état traité par Zotero.

### Citer avec `'`

1. Placez le curseur au point d’insertion dans Word.
2. Sélectionnez une ou plusieurs références dans Zotero.
3. Appuyez sur l’apostrophe `'` pour les transmettre au mécanisme natif de citation.

Dans un onglet de lecture, le raccourci cite la notice parente de la pièce jointe. Un PDF indépendant sans parent ne crée pas de citation vide. Saisir une apostrophe dans un champ de recherche ou de saisie ne déclenche pas le raccourci.

<details>
<summary>Démonstration du raccourci</summary>

![Citation au clavier](https://user-images.githubusercontent.com/44738481/215477177-c0a58567-a5e4-410c-a8d4-c1207fab02b0.gif)

</details>

### Glisser-déposer dans Word

Avec **Citation** visible, glissez des références bibliographiques ordinaires depuis n’importe quelle colonne vers le point d’insertion dans Word.

-   **Afficher Citation active ce mode ; masquer la colonne le désactive.** Le raccourci clavier reste indépendant.
-   Un dépôt dans une collection Zotero conserve le classement natif sans insérer de citation Word.
-   Les pièces jointes, notes et sélections mixtes utilisent le glisser-déposer natif de Zotero.
-   Une annulation ou un relâchement hors de Word ne soumet pas de citation rapide.

À un emplacement approprié près de `[1]`, Zotero peut fusionner une référence en `[1, 2]` au lieu d’ajouter `[1][2]`. Le résultat dépend du curseur, des citations existantes et du style.

<details>
<summary>Démonstration du glisser-déposer</summary>

![Glisser pour citer](https://user-images.githubusercontent.com/51939531/220587000-ce2842cd-8ec5-4f8a-92f3-f78662abb6be.gif)

</details>

> Ces démonstrations proviennent d’anciennes versions ; l’interface actuelle peut différer.

Pour conserver la colonne Citation sans citer par glisser-déposer, définissez `extensions.zotero.zoterocitation.dragCite.enable` sur `false` dans l’éditeur de configuration Zotero. Remettez `true` pour le réactiver. Le raccourci clavier reste actif.

## Fonctionnement technique

Le plugin relie **les sessions de citation Zotero, la liste des références et l’intégration native Word**. Il ne décompresse ni n’analyse les fichiers `.docx` pour extraire la liste complète et n’implémente pas lui-même l’écriture des champs Word.

### 1. Synchronisation des collections

[`src/modules/citation.ts`](src/modules/citation.ts) recherche chaque seconde les sessions Word dans `Integration.sessions`, sans actualiser pendant le traitement d’un document par Zotero.

-   `citationsByItemID` fournit les correspondances entre références et citations ; `citationsByIndex` donne l’ordre de première apparition.
-   La comparaison des ensembles d’identifiants permet une mise à jour incrémentale dans une transaction de base de données.
-   Les données de colonne sont mises en cache ; les notifications Zotero déclenchent le rafraîchissement visuel.

Les clés des collections appartenant au plugin sont enregistrées dans une préférence locale pour leur nettoyage. Les marqueurs de relation des anciennes versions sont aussi reconnus. Aucune collection n’est supprimée sur son seul nom, ni aucune ancienne recherche enregistrée sans preuve d’appartenance.

### 2. Identification des noms par les métadonnées

[`src/modules/wordDocuments.ts`](src/modules/wordDocuments.ts) tente de lire les noms des documents ouverts et leurs propriétés Zotero environ toutes les cinq secondes : **PowerShell/COM sous Windows**, **AppleScript sous macOS**.

Les propriétés consécutives `ZOTERO_PREF_1`, `ZOTERO_PREF_2`, etc. sont concaténées puis analysées par `DocumentData` de Zotero. Le `sessionID` obtenu relie document et session, sans déduire le nom du titre de la fenêtre active. Les identifiants partagés par plusieurs documents sont exclus de la correspondance. Un échec de lecture des noms n’empêche pas la synchronisation des sessions existantes.

### 3. Soumission au mécanisme natif

[`src/modules/cite.ts`](src/modules/cite.ts) retrouve les parents des pièces jointes, filtre les références invalides et les doublons, puis appelle `addEditCitation`.

Zotero n’expose actuellement pas d’API publique `insertCitation(items)`. Le plugin observe temporairement les fenêtres de citation, identifie celle de sa commande, la masque, ajoute les identifiants à `CitationEditInterface` et appelle `accept()`. Les dialogues nécessaires, comme le choix initial du style, restent gérés par Zotero.

Zotero assure chargement des champs, fusion, formatage et écriture. Le plugin ne remplace ni `Session.cite()` ni `execCommand()` et ne possède pas de moteur de formatage distinct. Les observateurs temporaires sont ensuite retirés.

### 4. Colonne et événements de glisser-déposer

[`src/modules/views.ts`](src/modules/views.ts) enregistre la colonne avec `ItemTreeManager` et capture les glissements de références ordinaires au niveau DOM. Le type `zotero/item` est conservé pour les dépôts internes. Pour un dépôt externe, l’état d’annulation et les informations du système sur la fenêtre sous le pointeur déterminent s’il faut citer ; voir [`src/modules/wordTarget.ts`](src/modules/wordTarget.ts).

Quick Copy et `onDragStart` de l’arbre ne sont pas remplacés. Un habillage réversible de méthode affiche les icônes Word. À l’arrêt, les écouteurs et la colonne sont retirés, et les icônes restaurées.

> Les données internes des sessions et les interfaces des fenêtres ne constituent pas des API publiques stables. Les mises à jour de Zotero ou de son intégration Word peuvent nécessiter une adaptation. Détails : [Citation integration](docs/citation-integration.md).

## Dépannage

-   **Pas de collection ?** Ouvrir Word ne suffit pas toujours. Insérez une citation ou cliquez sur **Refresh**, puis attendez la fin du traitement.
-   **Pas de nom de document ?** Lancez une commande Zotero dans Word et attendez ; vérifiez les autorisations d’automatisation macOS. Métadonnées absentes, identifiants identiques ou dialogue Word peuvent laisser `Word (n)`. Renommer ne rend pas la collection permanente.
-   **Collection encore présente après fermeture de Word ?** Zotero peut conserver la session. Les collections suivent les sessions, pas les fenêtres ; l’arrêt du plugin ou de Zotero tente leur nettoyage.
-   **Le dépôt n’insère rien ?** Affichez Citation, glissez des références ordinaires et relâchez dans Word. Vérifiez **Add/Edit Citation** et terminez les opérations ou dialogues en attente.
-   **Erreur d’intégration ?** Vérifiez que le complément Word correspond à Zotero ; réinstallez-le depuis les paramètres de citation si nécessaire. Le plugin ne contourne pas une intégration native défectueuse.

## Développement et validation

Le projet utilise TypeScript et esbuild :

```bash
npm ci
npm test
npm run tsc

# Construction locale sans modifier le manifeste de mise à jour
npm run build-prod -- --no-update
```

Résultat : `build/zotero-citation.xpi`. Test isolé dans Zotero :

```bash
npm run test:runtime
```

L’exécutable par défaut est `/Applications/Zotero.app/Contents/MacOS/zotero` ; utilisez `ZOTERO_BIN` pour le changer. Des dossiers temporaires isolent profil et données. Le test utilise le véritable arbre, les événements de glissement et les dialogues, mais un document simulé : **il ne vérifie pas l’écriture réelle dans Word**. Le dépôt interapplications à la souris et les requêtes COM Windows restent à tester sur leurs plateformes.

## Retours et remerciements

-   Signalez les problèmes dans [Issues](https://github.com/MuiseDestiny/zotero-citation/issues), avec système, versions Zotero/Word/plugin, étapes et erreurs.
-   Merci à [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template), [Zotero Addon Template](https://github.com/MuiseDestiny/zotero-addon-template) et aux projets libres associés.
-   Merci particulièrement à `@鑫鑫胖胖` et `@小明同学classic` pour les Mac mis à disposition pour le débogage distant.
-   Vous pouvez ajouter une étoile au dépôt ou [soutenir le développement](https://github.com/MuiseDestiny/zotero-reference#%E8%B5%9E%E5%8A%A9).

## Licence

[AGPL-3.0-or-later](LICENSE)
