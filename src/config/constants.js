export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const TILE_SIZE = 64;
export const MAP_COLS = 8;
export const MAP_ROWS = 8;

export const UNIT_SPRITE_TARGET_SIZE = TILE_SIZE * 0.9;
export const ENEMY_MOVE_DURATION = 1400;
export const ENEMY_ACTION_PAUSE = 750;
export const PLAYER_MOVE_DURATION = 1350;
export const PLAYER_ACTION_PAUSE = 450;
export const SKILL_BANNER_DURATION = 1250;
export const SKILL_IMPACT_DELAY = 520;
export const LEVEL_UP_PANEL_DEPTH = 20000;
export const STANDARD_BATTLE_PANEL_DEPTH = 15000;
export const STANDARD_BATTLE_INTRO_DURATION = 700;
export const STANDARD_BATTLE_HIT_STEP_DURATION = 900;
export const STANDARD_BATTLE_END_HOLD_DURATION = 900;
export const STANDARD_BATTLE_OUTRO_DURATION = 700;

export const SAVE_KEY = "bardsTacticsSave";
export const SAVE_SLOT_COUNT = 3;
export const SAVE_SLOT_KEY_PREFIX = `${SAVE_KEY}_slot_`;
export const TITLE_SCREEN_KEY = "bardsTitleScreen";
export const TITLE_SCREEN_PATH = "/ui/title_screen.png";
export const LOADING_RUNNER_KEY = "edwin_move_right";
export const LOADING_RUNNER_PATH = "/sprites/edwin/move_right.png";
export const ICE_OF_AGES_HIT_EFFECT_KEY = "iceOfAgesHitEffect";
export const ICE_OF_AGES_HIT_EFFECT_PATH = "/effects/ice_of_ages_hit.png";
export const BROTHERS_BLIGH_CUTIN_KEY = "brothersBlighCutin";
export const BROTHERS_BLIGH_CUTIN_PATH = "/effects/brothers_bligh_cutin.png";
export const BROTHERS_BLIGH_HIT_EFFECT_KEY = "brothersBlighHitEffect";
export const BROTHERS_BLIGH_HIT_EFFECT_PATH = "/effects/brothers_bligh_hit.png";
export const BROTHERS_BLIGH_SKILL = {
  id: "brothersBligh",
  name: "Brother's Bligh",
  cost: 3,
  partnerCost: 3,
  type: "forwardRectangle",
  width: 3,
  depth: 2,
  targetTeam: "enemy",
  damageFormula: "brothersCombinedStrMag",
  animationState: "magic",
  cutinKey: BROTHERS_BLIGH_CUTIN_KEY,
  hitEffectKey: BROTHERS_BLIGH_HIT_EFFECT_KEY,
};
export const PARLEY_SKILL = {
  id: "parley",
  name: "Parley",
  cost: 3,
  type: "adjacentRecruit",
};
export const RECRUITMENT_CONFIG = {
  falan: {
    recruitable: false,
  },
  shade_leader: {
    recruitable: true,
    baseId: "shade",
    positiveClose: "all",
    successLine: "The boss said if you beat me I should follow your orders and I don't see myself winning this.",
  },
};
export const OPPORTUNITY_ATTACK_HIT_RATE = 50;
export const OPPORTUNITY_ATTACK_PAUSE = 650;
export const SKILL_TILE_EFFECT_STAGGER = 180;
export const SKILL_TILE_EFFECT_APPEAR_DURATION = 220;
export const SKILL_TILE_EFFECT_HOLD_DURATION = 1000;
export const SKILL_TILE_EFFECT_FADE_DURATION = 700;
export const SKILL_TILE_EFFECT_END_SCALE = 1.18;
export const BROTHERS_BLIGH_HIT_APPEAR_DURATION = 100;
export const BROTHERS_BLIGH_HIT_HOLD_DURATION = 1000;
export const BROTHERS_BLIGH_HIT_FADE_DURATION = 380;
export const BROTHERS_BLIGH_CUTIN_HOLD_DURATION = 1500;
export const BROTHERS_BLIGH_CUTIN_FADE_DURATION = 360;
export const SMACK_SFX_KEY = "smackSfx";
export const SMACK_SFX_PATH = "/audio/smack.mp3";

export const CARDINAL_DIRECTIONS = ["down", "up", "left", "right"];
export const CLOCKWISE_DIRECTIONS = ["up", "right", "down", "left"];
export const LEVEL_UP_STATS = [
  { key: "hp", label: "HP", description: "+1 max HP and current HP" },
  { key: "str", label: "STR", description: "+1 physical damage" },
  { key: "mag", label: "MAG", description: "+1 magical damage" },
  { key: "def", label: "DEF", description: "+1 physical defence" },
  { key: "res", label: "RES", description: "+1 magical defence" },
  { key: "spd", label: "SPD", description: "+1 speed / extra attacks" },
  { key: "luck", label: "LUCK", description: "+1 crit chance and better level rolls" },
];

export const TARGET_HIGHLIGHT = {
  attack: { fill: 0xef4444, stroke: 0xfda4af },
  skill: { fill: 0xa78bfa, stroke: 0xddd6fe },
  item: { fill: 0x22c55e, stroke: 0xbbf7d0 },
};
