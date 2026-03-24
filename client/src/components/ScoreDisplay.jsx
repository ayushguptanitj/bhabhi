import { useMemo } from 'react';

const ScoreRing = ({ score, label, color = '#0071e3', size = 80 }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = useMemo(() => {
    const progress = Math.max(0, Math.min(100, score));
    const filled = (progress / 100) * circumference;
    return `${filled} ${circumference - filled}`;
  }, [score, circumference]);

  const getColor = (s) => {
    if (s >= 80) return '#34d399';
    if (s >= 60) return '#60a5fa';
    if (s >= 40) return '#fbbf24';
    return '#f87171';
  };

  const ringColor = color === 'auto' ? getColor(score) : color;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold" style={{ fontSize: size * 0.22 }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      {label && <span className="text-apple-gray-400 text-xs font-medium text-center">{label}</span>}
    </div>
  );
};

const ScoreBar = ({ label, score, color = '#0071e3' }) => {
  const getColor = (s) => {
    if (s >= 80) return '#34d399';
    if (s >= 60) return '#60a5fa';
    if (s >= 40) return '#fbbf24';
    return '#f87171';
  };
  const barColor = color === 'auto' ? getColor(score) : color;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-apple-gray-400 text-xs font-medium">{label}</span>
        <span className="text-white text-xs font-semibold">{Math.round(score)}/100</span>
      </div>
      <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
};

export { ScoreRing, ScoreBar };
