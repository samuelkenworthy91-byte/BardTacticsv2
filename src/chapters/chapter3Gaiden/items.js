export const CHAPTER_THREE_GAIDEN_ITEMS = [
  {
    id: "greggsSausageRoll",
    name: "Greggs Sausage Roll",
    type: "consumable",
    category: "food",
    heal: 8,
    uses: 1,
    targetType: "selfOrAdjacentAlly",
    description: "A warm, flaky snack. Restores 8 HP to the user or an adjacent ally.",
  },
  {
    id: "mysteriousEgg",
    name: "Mysterious Egg",
    type: "special",
    eggTracker: true,
    description: "A strange egg marked with a clock-like symbol. It may hatch after several chapters.",
  },
  {
    id: "tomeOfTerra",
    name: "Tome of Terra",
    type: "special",
    ownerHint: "leon",
    uses: 1,
    targetType: "self",
    leonOnlySkill: true,
    learnSkill: "fieldOfThorns",
    description: "Only Leon can use this tome to learn Field of Thorns.",
  },
  {
    id: "fightMilk",
    name: "Fight Milk",
    type: "consumable",
    uses: 1,
    targetType: "self",
    strengthBoost: 2,
    description: "A questionable drink. Raises Strength by 2 when consumed.",
  },
  {
    id: "skateboard",
    name: "Skateboard",
    type: "passive",
    passiveMoveBonus: 2,
    description: "Increases Movement by 2 while carried.",
  },
  {
    id: "tranqBomb",
    name: "Tranq Bomb",
    type: "throwable",
    uses: 1,
    targetType: "enemyInStrengthRange",
    tranqTurns: 3,
    description: "Throw up to STR range to knock an enemy unconscious for 3 turns or until damaged.",
  },
];

export const CHAPTER_THREE_GAIDEN_CHESTS = [
  { x: 0, y: 1, itemId: "greggsSausageRoll" },
  { x: 9, y: 1, itemId: "mysteriousEgg" },
  { x: 0, y: 3, itemId: "tomeOfTerra" },
  { x: 9, y: 3, itemId: "fightMilk" },
  { x: 0, y: 5, itemId: "skateboard" },
  { x: 9, y: 5, itemId: "tranqBomb" },
];

export const DIRK_ITEM = {
  id: "dirk",
  name: "Dirk",
  type: "passive",
  passiveDefensePierce: 2,
  description: "Attacks by the holder ignore 2 Defense while carried.",
};
