/*
 * Configuration Baby Quest
 * Modifie ces valeurs pour régler le résultat et les durées de l'animation.
 * revealSex : "boy" ou "girl"
 */
window.BABY_QUEST_CONFIG = {
  parentNames: "Max & Nath",
  subtitle: "RÉVÉLATION DU SEXE",
  subtitleEn: "GENDER REVEAL",
  revealSex: "boy",
  revealMessages: {
    boy: "On attend un petit mec !",
    girl: "C'est une petit miss !"
  },
  revealMessagesEn: {
    boy: "We're expecting a baby boy!",
    girl: "We're expecting a baby girl!"
  },
  finalMessage: "Rendez-vous en mars pour la suite de l'histoire !",
  finalMessageEn: "See you in March for the next chapter!",
  demoStats: {
    boy: 42,
    girl: 58
  },
  casino: {
    // Roulette : X secondes à vitesse constante, puis Y secondes de ralentissement.
    wheelCruiseSeconds: 6,
    wheelSlowdownSeconds: 3.5,
    wheelTurnsPerSecond: 1.15,

    // Bille : U secondes à vitesse constante, puis V secondes de ralentissement.
    // U > X et U + V > X + Y ; chaque décélération doit parcourir au moins 90° pour un arrêt fluide.
    ballCruiseSeconds: 8,
    ballSlowdownSeconds: 5,
    ballTurnsPerSecond: 1.45,

    // Attente après l'arrêt de la roulette et de la bille avant le reveal.
    revealDelaySeconds: 4
  }
};
