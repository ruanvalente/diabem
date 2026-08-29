import type { GlucoseChartPoint } from "@/lib/analytics/types";

type GlucoseLineChartProps = {
  points: GlucoseChartPoint[];
  average: number | null;
};

const WIDTH = 320;
const HEIGHT = 96;
const PAD_X = 10;
const PAD_Y = 10;

const PRIMARY = "var(--color-primary)";
const MUTED = "var(--color-muted)";

export function GlucoseLineChart({ points, average }: GlucoseLineChartProps) {
  if (points.length === 0) return null;

  const values = points.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = Math.max(maximum - minimum, 1);

  const yFor = (value: number) =>
    PAD_Y + (1 - (value - minimum) / span) * (HEIGHT - PAD_Y * 2);

  const averageY = average === null ? null : yFor(average);

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? WIDTH / 2
        : PAD_X + (index / (points.length - 1)) * (WIDTH - PAD_X * 2);
    return { x, y: yFor(point.value) };
  });

  const linePath = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="h-24 w-full"
      role="img"
      aria-label="Gráfico de linha com os valores de glicemia ao longo do tempo."
    >
      <line
        x1={PAD_X}
        x2={WIDTH - PAD_X}
        y1={HEIGHT / 2}
        y2={HEIGHT / 2}
        stroke={MUTED}
        strokeWidth={1}
        strokeDasharray="4 4"
        aria-hidden="true"
      />
      {averageY !== null && (
        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={averageY}
          y2={averageY}
          stroke="var(--color-chart-4)"
          strokeWidth={1}
          strokeDasharray="2 4"
          aria-hidden="true"
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={PRIMARY}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      />
      {coords.map((coord, index) => (
        <circle
          key={points[index].key}
          cx={coord.x}
          cy={coord.y}
          r={3.5}
          fill={PRIMARY}
          aria-hidden="true"
        />
      ))}
    </svg>
  );
}
