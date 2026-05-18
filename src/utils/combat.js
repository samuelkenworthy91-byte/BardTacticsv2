import { distance } from "./grid.js";

export function getWeaponForTarget(attacker, defender) {
  if (!attacker || !defender || !attacker.weapons) return null;
  const dist = distance(attacker, defender);
  return attacker.weapons.find((weapon) => {
    const minRange = weapon.minRange ?? weapon.range;
    const baseMaxRange = weapon.maxRange ?? weapon.range;
    const maxRange = baseMaxRange + ((baseMaxRange > 1 || weapon.range > 1) ? (attacker.rangeBonus || 0) : 0);
    return dist >= minRange && dist <= maxRange;
  }) || null;
}

export function getDefaultWeapon(unit) {
  return unit?.weapons?.[0] || null;
}

export function getWeaponRangeLabel(weapon) {
  if (!weapon) return "-";
  const minRange = weapon.minRange ?? weapon.range;
  const maxRange = (weapon.maxRange ?? weapon.range) + (weapon.rangeBonus || 0);
  return minRange === maxRange ? `${minRange}` : `${minRange}-${maxRange}`;
}

export function canAttack(attacker, defender) {
  return !!getWeaponForTarget(attacker, defender);
}
