/**
 * Formats an activity duration for display in PT-BR.
 *
 * Values under one hour render as minutes ("45 min"); whole hours render as
 * "2h"; mixed values render as "1h 30min".
 */
export function formatActivityDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}
