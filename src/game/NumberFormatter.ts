const SUFFIXES: [number, string][] = [
  [1e18, 'Qi'],
  [1e15, 'Qa'],
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

export function format(n: number): string {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + format(-n);
  if (n < 10000) return Math.floor(n).toLocaleString();
  for (const [threshold, suffix] of SUFFIXES) {
    if (n >= threshold) {
      return (n / threshold).toFixed(2) + suffix;
    }
  }
  return Math.floor(n).toLocaleString();
}
