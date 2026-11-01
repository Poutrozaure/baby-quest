# Baby Quest — prototype J2

## Lancer le site
1. Décompressez le dossier.
2. Ouvrez `index.html` dans un navigateur moderne.
3. Pour un environnement de développement plus fiable, ouvrez le dossier dans VS Code et lancez un serveur local (par exemple l'extension Live Server).

## Modifier le résultat
Ouvrez `config.js` et modifiez :
- `revealSex: "boy"` en `revealSex: "girl"` pour changer le résultat.
- `finalMessage` pour modifier le message final.
- `revealMessagesEn` et `finalMessageEn` pour personnaliser les textes de révélation en anglais ; `subtitleEn` permet de modifier le sous-titre anglais.
- `demoStats` pour tester la mise en page des statistiques.

## Langues
Le bouton `EN` / `FR` sur l'écran d'accueil change la langue de toute l'expérience. Le choix est mémorisé dans le navigateur. Les textes français personnalisés dans `config.js` ont leurs équivalents anglais dans `revealMessagesEn`, `finalMessageEn` et `subtitleEn`.

## État du prototype
- Les quatre écrans et la navigation fonctionnent.
- La sélection garçon/fille fonctionne.
- Sur l'écran de pari, la roulette tourne dans le sens horaire et la bille en sens inverse, à des vitesses différentes.
- Le titre « FAITES VOS JEUX » et le résultat « Gagné ! » / « Perdu ! » ont un effet respirant ; le son des pièces accompagne chaque sélection de pari.
- La révélation lit le résultat depuis `config.js`.
- Le rejeu permet de modifier le pari pour l'animation suivante, mais les statistiques personnelles restent liées au premier pari validé.
- Une seule roulette peut tourner à la fois ; une courte temporisation bloque les validations répétées.
- Les statistiques sont fictives pour la maquette ; aucun vote partagé n'est encore enregistré.
- Les illustrations et les sons utilisent les assets locaux du dossier `assets/`.
- La musique de fond démarre après le clic sur START, conformément aux restrictions de lecture automatique des navigateurs.

## Fichiers
- `index.html`: structure des écrans.
- `config.js`: configuration de la révélation.
- `css/style.css`: styles et animations.
- `js/app.js`: navigation et logique du prototype.


## Police Copyduck

Le CSS charge les fichiers locaux Copyduck (`assets/fonts/Copyduck.otf` et `.ttf`) avec une police de secours.

## Corrections J3

- L'accueil est inchangé visuellement.
- Les écrans de pari et de révélation masquent « Max & Nath » et « RÉVÉLATION DU SEXE », tout en gardant l'icône de son.
- La roulette et le tapis partagent maintenant la même structure et la même position sur les écrans 2 et 3.
- À la validation du pari, X/Y règlent la rotation et le ralentissement de la roulette ; U/V règlent ceux de la bille. La roulette s'arrête d'abord avec un secteur correspondant à `revealSex` en haut, puis la bille se pose sur un secteur aléatoire de la même couleur. La phase de décélération reprend la vitesse de croisière sans accélération brusque. Il faut configurer `U > X`, `U + V > X + Y` et des décélérations permettant au moins 90° de déplacement (`360 × vitesse × Y` pour la roue, `360 × vitesse × V` pour la bille). La mention « Gagné ! » ou « Perdu ! » apparaît quand la bille s'arrête ; la révélation arrive Z secondes après l'arrêt des deux.
- Les angles du cercle trigonométrique sont définis dans `js/app.js` : `girl` à 0°, 60°, 120°, 180°, 240° et 300° ; `boy` à 30°, 90°, 150°, 210°, 270° et 330°.
- Sur l'écran final, le message de mars est entre les personnages et les statistiques, et le bouton Rejouer est poussé vers le bas.
