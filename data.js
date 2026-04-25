// Programme 5 jours — split Push / Pull / Legs / Upper / Lower
// Adapté pour profil débutant-intermédiaire, objectif athlétique (force + hypertrophie)
const PROGRAM = {
  "Lundi — Push (Pecs/Épaules/Triceps)": [
    { name: "Développé couché barre", sets: 4, reps: "6-8", rest: "2-3 min", tip: "Échauffe-toi avec 2 séries légères avant les séries lourdes." },
    { name: "Développé militaire haltères", sets: 4, reps: "8-10", rest: "90 s", tip: "Garde le dos droit, pas de cambrure excessive." },
    { name: "Développé incliné haltères", sets: 3, reps: "10-12", rest: "90 s", tip: "Banc à 30°, contrôle la descente." },
    { name: "Élévations latérales", sets: 4, reps: "12-15", rest: "60 s", tip: "Coudes légèrement fléchis, ne monte pas plus haut que les épaules." },
    { name: "Dips lestés (ou poids du corps)", sets: 3, reps: "8-12", rest: "90 s", tip: "Penche-toi en avant pour cibler les pecs." },
    { name: "Extension triceps poulie corde", sets: 3, reps: "12-15", rest: "60 s", tip: "Écarte la corde en bas du mouvement." }
  ],
  "Mardi — Pull (Dos/Biceps)": [
    { name: "Tractions (lestées si possible)", sets: 4, reps: "6-10", rest: "2 min", tip: "Pas de balancier, descends complètement." },
    { name: "Rowing barre", sets: 4, reps: "8-10", rest: "2 min", tip: "Buste à ~45°, tire vers le nombril." },
    { name: "Tirage horizontal poulie", sets: 3, reps: "10-12", rest: "90 s", tip: "Serre les omoplates en fin de mouvement." },
    { name: "Tirage vertical prise neutre", sets: 3, reps: "10-12", rest: "90 s", tip: "Concentre-toi sur le grand dorsal." },
    { name: "Curl barre EZ", sets: 4, reps: "8-12", rest: "75 s", tip: "Coudes fixes le long du corps." },
    { name: "Curl marteau haltères", sets: 3, reps: "10-12", rest: "60 s", tip: "Cible le brachial pour des bras plus épais." }
  ],
  "Mercredi — Legs (Jambes complètes)": [
    { name: "Squat barre", sets: 4, reps: "6-8", rest: "3 min", tip: "Descends jusqu'à parallèle, pousse sur les talons." },
    { name: "Soulevé de terre roumain", sets: 4, reps: "8-10", rest: "2 min", tip: "Dos neutre, pousse les hanches en arrière." },
    { name: "Presse à cuisses", sets: 3, reps: "10-12", rest: "90 s", tip: "Pieds largeur épaules, pas de verrouillage des genoux." },
    { name: "Fentes haltères", sets: 3, reps: "10 / jambe", rest: "90 s", tip: "Le genou avant ne dépasse pas la pointe du pied." },
    { name: "Leg curl machine (ischios)", sets: 3, reps: "12-15", rest: "60 s", tip: "Contraction marquée en haut." },
    { name: "Mollets debout", sets: 4, reps: "15-20", rest: "45 s", tip: "Étirement complet en bas." }
  ],
  "Jeudi — Repos / mobilité": [
    { name: "Marche active 30-45 min", sets: 1, reps: "—", rest: "—", tip: "Sortie en extérieur, aide à la récupération." },
    { name: "Étirements / mobilité hanches & épaules", sets: 1, reps: "15 min", rest: "—", tip: "Travaille les zones raides, pas de douleur." }
  ],
  "Vendredi — Upper (Haut du corps)": [
    { name: "Développé incliné barre", sets: 4, reps: "6-8", rest: "2-3 min", tip: "Variante pour cibler le haut des pectoraux." },
    { name: "Tractions supination", sets: 4, reps: "6-10", rest: "2 min", tip: "Travaille dos + biceps." },
    { name: "Développé Arnold", sets: 3, reps: "10-12", rest: "90 s", tip: "Mouvement complet de rotation." },
    { name: "Rowing haltère un bras", sets: 3, reps: "10 / bras", rest: "75 s", tip: "Tire le coude haut, contrôle la descente." },
    { name: "Élévations latérales penché (postérieur)", sets: 3, reps: "12-15", rest: "60 s", tip: "Buste incliné à 45°." },
    { name: "Superset : Curl pupitre + Pompes triceps serrées", sets: 3, reps: "10 + max", rest: "75 s", tip: "Enchaîne sans repos entre les deux." }
  ],
  "Samedi — Lower + Core": [
    { name: "Front squat", sets: 4, reps: "6-8", rest: "2-3 min", tip: "Coudes hauts, dos vertical." },
    { name: "Hip thrust", sets: 4, reps: "8-10", rest: "2 min", tip: "Contraction maximale des fessiers en haut." },
    { name: "Step-up haltères", sets: 3, reps: "10 / jambe", rest: "90 s", tip: "Box à hauteur de genou." },
    { name: "Leg extension", sets: 3, reps: "12-15", rest: "60 s", tip: "Pause d'1s en haut." },
    { name: "Gainage planche", sets: 3, reps: "45-60 s", rest: "45 s", tip: "Corps aligné, fessiers serrés." },
    { name: "Relevé de jambes suspendu", sets: 3, reps: "10-15", rest: "60 s", tip: "Pas de balancier, abdos contractés." },
    { name: "Russian twist lesté", sets: 3, reps: "20 (10/côté)", rest: "45 s", tip: "Mouvement contrôlé." }
  ],
  "Dimanche — Repos complet": [
    { name: "Repos total", sets: 0, reps: "—", rest: "—", tip: "La récupération = la croissance. Hydrate-toi, dors 8h+." }
  ]
};

// Plan repas type — ~2850 kcal / 130P · 380C · 80F
const MEAL_PLAN = [
  {
    name: "Petit-déjeuner (≈ 700 kcal)",
    items: [
      "80 g flocons d'avoine",
      "300 ml lait demi-écrémé",
      "1 banane",
      "30 g amandes",
      "2 œufs entiers"
    ],
    macros: "P: 35g · C: 80g · L: 25g"
  },
  {
    name: "Collation matin (≈ 350 kcal)",
    items: [
      "1 yaourt grec 0% (200 g)",
      "30 g whey protéine",
      "1 pomme",
      "1 c.à.s miel"
    ],
    macros: "P: 35g · C: 45g · L: 3g"
  },
  {
    name: "Déjeuner (≈ 800 kcal)",
    items: [
      "150 g poulet / dinde / bœuf maigre",
      "100 g riz basmati (cru)",
      "Légumes verts à volonté",
      "1 c.à.s huile d'olive",
      "1 fruit"
    ],
    macros: "P: 45g · C: 95g · L: 18g"
  },
  {
    name: "Collation pré-training (≈ 350 kcal)",
    items: [
      "2 tranches pain complet",
      "2 c.à.s beurre de cacahuète",
      "1 banane",
      "Café noir / thé vert"
    ],
    macros: "P: 12g · C: 55g · L: 16g"
  },
  {
    name: "Dîner (≈ 650 kcal)",
    items: [
      "150 g saumon / poisson blanc / steak haché 5%",
      "200 g patate douce",
      "Salade variée + huile d'olive",
      "1 yaourt nature"
    ],
    macros: "P: 40g · C: 70g · L: 18g"
  }
];

// Aliments fréquents pour ajout rapide (kcal, P, C, L pour la portion indiquée)
const QUICK_FOODS = [
  { name: "Œuf entier (1)", kcal: 78, p: 6, c: 0.6, f: 5 },
  { name: "Blanc de poulet 100g", kcal: 165, p: 31, c: 0, f: 3.6 },
  { name: "Riz cuit 100g", kcal: 130, p: 2.7, c: 28, f: 0.3 },
  { name: "Pâtes cuites 100g", kcal: 158, p: 5.8, c: 31, f: 0.9 },
  { name: "Banane (moyenne)", kcal: 105, p: 1.3, c: 27, f: 0.4 },
  { name: "Whey 30g", kcal: 120, p: 24, c: 2, f: 1.5 },
  { name: "Avoine 50g", kcal: 190, p: 6.5, c: 33, f: 3.5 },
  { name: "Yaourt grec 0% 200g", kcal: 120, p: 20, c: 8, f: 0 },
  { name: "Amandes 30g", kcal: 174, p: 6, c: 6, f: 15 },
  { name: "Saumon 100g", kcal: 208, p: 20, c: 0, f: 13 },
  { name: "Patate douce 200g", kcal: 172, p: 3.2, c: 40, f: 0.2 },
  { name: "Pain complet (1 tranche)", kcal: 80, p: 4, c: 14, f: 1 }
];
