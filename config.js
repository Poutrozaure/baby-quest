/*
 * Configuration Baby Quest
 * Modifie les valeurs ici sans toucher aux animations.
 *
 * revealSex : "boy" ou "girl"
 * Les statistiques sont encore en mode démo jusqu'à la connexion Supabase (J6).
 */
window.BABY_QUEST_CONFIG = {
  parentNames: "Max & Nath",
  subtitle: "RÉVÉLATION DU SEXE",
  revealSex: "girl",
  revealMessages: {
    boy: "C'est un garçon !",
    girl: "C'est une fille !"
  },
  finalMessage: "Rendez-vous en mars pour la suite de l'histoire !",
  demoStats: {
    boy: 42,
    girl: 58
  },
  spinDurationMs: 5200
};
