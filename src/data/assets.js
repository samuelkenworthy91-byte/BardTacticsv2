import {
  BROTHERS_BLIGH_CUTIN_KEY,
  BROTHERS_BLIGH_CUTIN_PATH,
  BROTHERS_BLIGH_HIT_EFFECT_KEY,
  BROTHERS_BLIGH_HIT_EFFECT_PATH,
  ICE_OF_AGES_HIT_EFFECT_KEY,
  ICE_OF_AGES_HIT_EFFECT_PATH,
  SMACK_SFX_KEY,
  SMACK_SFX_PATH,
  TILE_SIZE,
} from "../config/constants.js";
import { LEVELS } from "../chapters/index.js";

export function createDirectionalStateEntries(unitKey, state) {
  return {
    down: { key: `${unitKey}_${state}_down`, path: `/sprites/${unitKey}/${state}_down.png` },
    up: { key: `${unitKey}_${state}_up`, path: `/sprites/${unitKey}/${state}_up.png` },
    left: { key: `${unitKey}_${state}_left`, path: `/sprites/${unitKey}/${state}_left.png` },
    right: { key: `${unitKey}_${state}_right`, path: `/sprites/${unitKey}/${state}_right.png` },
  };
}

export function createDeathEntries(unitKey) {
  return [1, 2, 3, 4].map((index) => ({
    key: `${unitKey}_death_${index}`,
    path: `/sprites/${unitKey}/death_${index}.png`,
  }));
}

export function getSpriteSetAliases(unitKey) {
  const aliases = [unitKey];

  if (unitKey?.endsWith("_thug")) {
    const weaponName = unitKey.replace("_thug", "");
    aliases.push(`thug_${weaponName}`);
    aliases.push("thug");
  }

  if (unitKey?.startsWith("thug_")) {
    const weaponName = unitKey.replace("thug_", "");
    aliases.push(`${weaponName}_thug`);
    aliases.push("thug");
  }

  return [...new Set(aliases.filter(Boolean))];
}

export function safeSpriteKeyPart(value) {
  return String(value || "sprite").replace(/[^a-zA-Z0-9_]/g, "_");
}

export function createDirectionalSpriteCandidateEntries(unitKey, state, direction) {
  const aliases = getSpriteSetAliases(unitKey);
  const entries = [];

  aliases.forEach((alias, aliasIndex) => {
    const aliasPart = safeSpriteKeyPart(alias);
    entries.push({
      key: `${unitKey}_${state}_${direction}_candidate_${aliasIndex}_${aliasPart}_directional`,
      path: `/sprites/${alias}/${state}_${direction}.png`,
    });
    entries.push({
      key: `${unitKey}_${state}_${direction}_candidate_${aliasIndex}_${aliasPart}_named_directional`,
      path: `/sprites/${alias}/${alias}_${state}_${direction}.png`,
    });
    entries.push({
      key: `${unitKey}_${state}_${direction}_candidate_${aliasIndex}_${aliasPart}_named_state`,
      path: `/sprites/${alias}/${alias}_${state}.png`,
    });
    entries.push({
      key: `${unitKey}_${state}_${direction}_candidate_${aliasIndex}_${aliasPart}_plain_state`,
      path: `/sprites/${alias}/${state}.png`,
    });
  });

  return entries;
}

export function createDeathSpriteCandidateEntries(unitKey, frameIndex = 0) {
  const frameNumber = Math.max(1, frameIndex + 1);
  const aliases = getSpriteSetAliases(unitKey);
  const entries = [];

  aliases.forEach((alias, aliasIndex) => {
    const aliasPart = safeSpriteKeyPart(alias);
    entries.push({
      key: `${unitKey}_death_${frameNumber}_candidate_${aliasIndex}_${aliasPart}_numbered`,
      path: `/sprites/${alias}/death_${frameNumber}.png`,
    });
    entries.push({
      key: `${unitKey}_death_${frameNumber}_candidate_${aliasIndex}_${aliasPart}_named_numbered`,
      path: `/sprites/${alias}/${alias}_death_${frameNumber}.png`,
    });
    entries.push({
      key: `${unitKey}_death_${frameNumber}_candidate_${aliasIndex}_${aliasPart}_named_state`,
      path: `/sprites/${alias}/${alias}_death.png`,
    });
    entries.push({
      key: `${unitKey}_death_${frameNumber}_candidate_${aliasIndex}_${aliasPart}_plain_state`,
      path: `/sprites/${alias}/death.png`,
    });
  });

  return entries;
}

export function uniqueSpriteEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (!entry?.key || !entry?.path || seen.has(entry.key)) return false;
    seen.add(entry.key);
    return true;
  });
}

export const INDIVIDUAL_UNIT_SPRITE_SETS = {
  edwin: {
    idle: createDirectionalStateEntries("edwin", "idle"),
    move: createDirectionalStateEntries("edwin", "move"),
    attack: createDirectionalStateEntries("edwin", "attack"),
    magic: createDirectionalStateEntries("edwin", "magic"),
    hurt: createDirectionalStateEntries("edwin", "hurt"),
    death: createDeathEntries("edwin"),
  },
  leon: {
    idle: createDirectionalStateEntries("leon", "idle"),
    move: createDirectionalStateEntries("leon", "move"),
    attack: createDirectionalStateEntries("leon", "attack"),
    hurt: createDirectionalStateEntries("leon", "hurt"),
    death: createDeathEntries("leon"),
  },
  falan: {
    idle: createDirectionalStateEntries("falan", "idle"),
    move: createDirectionalStateEntries("falan", "move"),
    attack: createDirectionalStateEntries("falan", "attack"),
    spin: createDirectionalStateEntries("falan", "spin"),
    hurt: createDirectionalStateEntries("falan", "hurt"),
    death: createDeathEntries("falan"),
  },
  sword_thug: {
    idle: createDirectionalStateEntries("sword_thug", "idle"),
    move: createDirectionalStateEntries("sword_thug", "move"),
    attack: createDirectionalStateEntries("sword_thug", "attack"),
    hurt: createDirectionalStateEntries("sword_thug", "hurt"),
    death: createDeathEntries("sword_thug"),
  },
  axe_thug: {
    idle: createDirectionalStateEntries("axe_thug", "idle"),
    move: createDirectionalStateEntries("axe_thug", "move"),
    attack: createDirectionalStateEntries("axe_thug", "attack"),
    hurt: createDirectionalStateEntries("axe_thug", "hurt"),
    death: createDeathEntries("axe_thug"),
  },
  chakram_thug: {
    idle: createDirectionalStateEntries("chakram_thug", "idle"),
    move: createDirectionalStateEntries("chakram_thug", "move"),
    attack: createDirectionalStateEntries("chakram_thug", "attack"),
    hurt: createDirectionalStateEntries("chakram_thug", "hurt"),
    death: createDeathEntries("chakram_thug"),
  },
};

export const UNIT_SPRITE_RENDER = {
  default: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.96,
    offsetX: 0,
    offsetY: 0,
    deathOffsetY: 0,
    originX: 0.5,
    originY: 1,
    shadowWidth: TILE_SIZE * 0.42,
    shadowHeight: TILE_SIZE * 0.12,
    shadowX: 0,
    shadowY: 2,
    hpY: TILE_SIZE * 0.22,
  },
  edwin: {
    height: TILE_SIZE * 0.96,
    maxWidth: TILE_SIZE * 1.05,
    originX: 0.5,
    originY: 0.63,
    shadowWidth: TILE_SIZE * 0.42,
    shadowHeight: TILE_SIZE * 0.12,
    shadowX: 0,
    shadowY: TILE_SIZE * 0.16,
    hpY: TILE_SIZE * 0.34,
  },
  leon: {
    height: TILE_SIZE * 0.8,
    maxWidth: TILE_SIZE * 0.92,
    shadowWidth: TILE_SIZE * 0.4,
  },
  falan: {
    height: TILE_SIZE * 0.86,
    maxWidth: TILE_SIZE * 1.02,
    shadowWidth: TILE_SIZE * 0.44,
  },
  sword_thug: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    shadowWidth: TILE_SIZE * 0.42,
  },
  axe_thug: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    shadowWidth: TILE_SIZE * 0.42,
  },
  chakram_thug: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    shadowWidth: TILE_SIZE * 0.42,
  },
};

export const BIOMES = {
  city: {
    terrainTextures: {
      street: { key: "cityStreetTile", path: "/tiles/city/street.png" },
      cover: { key: "cityCoverTile", path: "/tiles/city/cover.png" },
      wall: { key: "cityWallTile", path: "/tiles/city/wall.png" },
      gate: { key: "cityGateTile", path: "/tiles/city/gate.png" },
      default: { key: "cityStreetTile", path: "/tiles/city/street.png" },
    },
  },
  farm: {
    terrainTextures: {
      field: { key: "farmFieldTile", path: "/tiles/farm/field.png" },
      cover: { key: "farmCoverTile", path: "/tiles/farm/cover.png" },
      fort: { key: "farmFortTile", path: "/tiles/farm/fort.png" },
      fence: { key: "farmFenceTile", path: "/tiles/farm/fence.png" },
      default: { key: "farmFieldTile", path: "/tiles/farm/field.png" },
    },
  },
};

export function queueImage(scene, key, path) {
  if (!scene || !key || !path) return;
  if (scene.textures.exists(key)) return;
  scene.load.image(key, path);
}

export function queueAudio(scene, key, path) {
  if (!scene || !key || !path) return;
  if (scene.cache?.audio?.exists(key)) return;
  scene.load.audio(key, [path]);
}

export function queueBiomeTileAssets(scene, biomeKey) {
  const biome = BIOMES[biomeKey];
  if (!biome) return;
  const queuedKeys = new Set();
  Object.values(biome.terrainTextures).forEach((entry) => {
    if (!entry?.key || !entry?.path || queuedKeys.has(entry.key)) return;
    queueImage(scene, entry.key, entry.path);
    queuedKeys.add(entry.key);
  });
}

export function queueIndividualDirectionalSpriteAssets(scene) {
  const queuedKeys = new Set();

  const queueEntry = (entry) => {
    if (!entry?.key || !entry?.path || queuedKeys.has(entry.key)) return;
    queueImage(scene, entry.key, entry.path);
    queuedKeys.add(entry.key);
  };

  Object.entries(INDIVIDUAL_UNIT_SPRITE_SETS).forEach(([spriteSetKey, spriteSet]) => {
    Object.entries(spriteSet).forEach(([state, entry]) => {
      if (Array.isArray(entry)) {
        entry.forEach((frameEntry, frameIndex) => {
          queueEntry(frameEntry);
          uniqueSpriteEntries(createDeathSpriteCandidateEntries(spriteSetKey, frameIndex)).forEach(queueEntry);
        });
        return;
      }

      Object.entries(entry || {}).forEach(([direction, directionEntry]) => {
        queueEntry(directionEntry);
        uniqueSpriteEntries(createDirectionalSpriteCandidateEntries(spriteSetKey, state, direction)).forEach(queueEntry);
      });
    });
  });
}

export function queueChapterAssets(scene, levelData = LEVELS.chapter1) {
  queueImage(scene, "edwinPortrait", "/portraits/edwin.jpg");
  queueImage(scene, "leonPortrait", "/portraits/leon.jpg");
  queueImage(scene, "kayleyPortrait", "/portraits/kayley.jpg");
  queueImage(scene, "richPortrait", "/portraits/rich.jpg");
  queueImage(scene, "falanPortrait", "/portraits/falan.jpg");
  queueImage(scene, "thugPortrait", "/portraits/thug.jpg");
  queueImage(scene, "heathPortrait", "/portraits/heath.jpg");
  queueImage(scene, "izzyPortrait", "/portraits/izzy.jpg");
  queueImage(scene, "prologueScene", "/scenes/prologue.jpg");
  queueImage(scene, "leonsHouseScene", "/scenes/leons_house.jpg");
  queueImage(scene, "walkToSchoolScene", "/scenes/walk_to_school.jpg");
  queueImage(scene, "underpassScene", "/scenes/underpass.jpg");
  queueImage(scene, "vanInteriorScene", "/scenes/van_interior.jpg");
  queueImage(scene, "byronFarmScene", "/scenes/byron_farm.jpg");
  queueImage(scene, "chapter2BedroomScene", "/scenes/chapter2_bedroom.jpg");
  queueImage(scene, "chapter2EdwinDoorScene", "/scenes/chapter2_edwin_door.jpg");
  queueImage(scene, "chapter2FuneralSplitScene", "/scenes/chapter2_funeral_split.jpg");
  queueImage(scene, "chapter2SigilScene", "/scenes/chapter2_sigil.jpg");
  queueImage(scene, "chapter2CalebExperimentScene", "/scenes/chapter2_caleb_experiment.jpg");
  queueImage(scene, "chapter2EdwinGuildliteScene", "/scenes/chapter2_edwin_guildlites.jpg");
  queueImage(scene, "chapter2LeonShockedScene", "/scenes/chapter2_leon_shocked.jpg");
  queueImage(scene, ICE_OF_AGES_HIT_EFFECT_KEY, ICE_OF_AGES_HIT_EFFECT_PATH);
  queueImage(scene, BROTHERS_BLIGH_CUTIN_KEY, BROTHERS_BLIGH_CUTIN_PATH);
  queueImage(scene, BROTHERS_BLIGH_HIT_EFFECT_KEY, BROTHERS_BLIGH_HIT_EFFECT_PATH);
  queueBiomeTileAssets(scene, levelData?.biome);
  queueIndividualDirectionalSpriteAssets(scene);
  queueAudio(scene, SMACK_SFX_KEY, SMACK_SFX_PATH);
  if (levelData?.battleMusic?.key && levelData?.battleMusic?.path) {
    queueAudio(scene, levelData.battleMusic.key, levelData.battleMusic.path);
  }
}
