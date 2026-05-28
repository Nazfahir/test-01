import { describe, expect, it } from 'vitest';
import { normalizeNoRepeatAnswer } from '@/features/games/no-repeat';

describe('normalizeNoRepeatAnswer', () => {
  it('normaliza mayúsculas, acentos y espacios', () => {
    expect(normalizeNoRepeatAnswer('  ÁrBOL   de   NAVIDAD  ')).toBe('arbol de navidad');
  });

  it('elimina artículos comunes', () => {
    expect(normalizeNoRepeatAnswer('La casa de los amigos')).toBe('casa de amigos');
  });

  it('puede quedar vacío si solo hay artículos/espacios', () => {
    expect(normalizeNoRepeatAnswer('  el   la   los  ')).toBe('');
  });
});
