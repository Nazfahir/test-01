const SPANISH_ARTICLES = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'al', 'del',
]);

export const NO_REPEAT_MAX_LENGTH = 30;

export function normalizeNoRepeatAnswer(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter((word) => word && !SPANISH_ARTICLES.has(word))
    .join(' ');
}
