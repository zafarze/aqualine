interface MiniAreaProps {
  data: number[];
  color?: string;
  height?: number;
}

export function MiniArea({
  data,
  color = "#F5C24A",
  height = 130,
}: MiniAreaProps) {
  const w = 600;
  const h = height;
  const pad = 8;
  if (data.length < 2) {
    return <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32" />;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = pad + (i * (w - 2 * pad)) / (data.length - 1);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return [x, y] as const;
  });
  const linePath = points.map(([x, y], i) =>
    `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
  ).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(2)},${h - pad} L${pad},${h - pad} Z`;
  const gradId = "mini-area-grad";
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-32"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
