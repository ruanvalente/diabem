/**
 * Formats an ISO date-time as `dd/mm às hh:mm` in the `pt-BR` locale.
 * Returns the input unchanged when it is not a valid date.
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return (
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " às " +
    date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}