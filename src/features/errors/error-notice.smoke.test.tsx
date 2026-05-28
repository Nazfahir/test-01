import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ErrorNotice } from '@/components/ui/ErrorNotice';

describe('ErrorNotice smoke', () => {
  it('renders room not found state', () => {
    const html = renderToString(<ErrorNotice code="ROOM_NOT_FOUND" />);
    expect(html).toContain('Sala no encontrada');
  });

  it('renders connection fallback state', () => {
    const html = renderToString(<ErrorNotice code="CONNECTION_LOST" />);
    expect(html).toContain('Conexión inestable');
  });
});
