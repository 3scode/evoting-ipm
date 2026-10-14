export function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.trim().split('\n');
  const head = (lines.shift() ?? '').split(',').map((s) => s.trim().toLowerCase());
  return lines.map((l) => {
    const cells = l.split(',');
    const row: Record<string, string> = {};
    head.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim();
    });
    return row;
  });
}
