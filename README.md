# Baby Quest — prototype J2

## Lancer le site
1. Décompressez le dossier.
2. Ouvrez `index.html` dans un navigateur moderne.
3. Pour un environnement de développement plus fiable, ouvrez le dossier dans VS Code et lancez un serveur local (par exemple l'extension Live Server).

## Modifier le résultat
Ouvrez `config.js` et modifiez :
- `revealSex: "boy"` en `revealSex: "girl"` pour changer le résultat.
- `finalMessage` pour modifier le message final.
- `demoStats` pour tester la mise en page des statistiques.

## État du prototype
- Les quatre écrans et la navigation fonctionnent.
- La sélection garçon/fille fonctionne.
- La roue et la bille s'animent en sens inverse.
- La révélation lit le résultat depuis `config.js`.
- Le rejeu relance l'expérience sans créer de vote.
- Les statistiques sont fictives pour la maquette ; Supabase sera branché ultérieurement.
- Les illustrations actuelles sont des placeholders. La police Copyduck est utilisée si elle est installée localement ; sinon une police de secours est utilisée.

## Fichiers
- `index.html`: structure des écrans.
- `config.js`: configuration de la révélation.
- `css/style.css`: styles et animations.
- `js/app.js`: navigation et logique du prototype.


## Police Copyduck

Le CSS charge Copyduck depuis `assets/fonts/`. Pour que la police locale soit détectée sur tous les systèmes, placez-y une version nommée `Copyduck.otf` ou `Copyduck.ttf` (la casse du nom compte sur certains serveurs). Le prototype disponible dans cette archive ne contenait pas encore les fichiers de police eux-mêmes.

## Corrections J3

- L'accueil est inchangé visuellement.
- Les écrans de pari et de révélation masquent « Max & Nath » et « RÉVÉLATION DU SEXE », tout en gardant l'icône de son.
- La roulette et le tapis partagent maintenant la même structure et la même position sur les écrans 2 et 3.
- À la validation du pari, la roue et la bille gardent leur angle courant, tournent à vitesse constante 3 secondes, puis décélèrent. La roue s'aligne sur la couleur choisie et la bille s'arrête en haut. La révélation arrive 2 secondes après l'arrêt complet.
- Sur l'écran final, le message de mars est entre les personnages et les statistiques, et le bouton Rejouer est poussé vers le bas.
