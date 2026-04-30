import { distance } from "./grid.js";

export function getWeaponForTarget(attacker, defender) {
  if (!attacker || !defender || !attacker.weapons) return null;
  const dist = distance(attacker, defender);
  return attacker.weapons.find((weapon) => {
    const minRange = weapon.minRange ?? weapon.range;
    const maxRange = weapon.maxRange ?? weapon.range;
    return dist >= minRange && dist <= maxRange;
  }) || null;
}

export function getDefaultWeapon(unit) {
  return unit?.weapons?.[0] || null;
}

export function getWeaponRangeLabel(weapon) {
  if (!weapon) return "-";
  const minRange = weapon.minRange ?? weapon.range;
  const maxRange = weapon.maxRange ?? weapon.range;
  return minRange === maxRange ? `${minRange}` : `${minRange}-${maxRange}`;
}

export function canAttack(attacker, defender) {
  return !!getWeaponForTarget(attacker, defender);
}
