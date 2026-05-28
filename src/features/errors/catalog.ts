export type OrbitasErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_NOT_JOINABLE'
  | 'NOT_HOST'
  | 'MIN_PLAYERS_NOT_MET'
  | 'PROMPTS_UNAVAILABLE'
  | 'ROUND_STATE_INVALID'
  | 'SUBMISSION_REJECTED'
  | 'CONNECTION_LOST'
  | 'SAVE_CURRENCY_FAILED'
  | 'GUEST_CONVERSION_FAILED'
  | 'UNKNOWN';

export type OrbitasErrorSeverity = 'info' | 'warning' | 'error';
export type OrbitasErrorUX = { code: OrbitasErrorCode; title: string; description: string; actionLabel: string; actionHref?: string; severity: OrbitasErrorSeverity };
const ERROR_UX_MAP: Record<OrbitasErrorCode, Omit<OrbitasErrorUX, 'code'>> = { ROOM_NOT_FOUND:{title:'Sala no encontrada',description:'No vimos esa sala. Revisa el código o pide un link nuevo al grupo.',actionLabel:'Volver a unirme',actionHref:'/rooms/join',severity:'warning'},ROOM_FULL:{title:'Sala completa',description:'Esta sala ya llegó al máximo de 8 personas.',actionLabel:'Crear sala nueva',actionHref:'/rooms/create',severity:'warning'},ROOM_NOT_JOINABLE:{title:'Sala no disponible',description:'La sala ya inició, cerró o expiró. Puedes abrir otra en segundos.',actionLabel:'Crear otra sala',actionHref:'/rooms/create',severity:'warning'},NOT_HOST:{title:'Acción solo para host',description:'Solo quien creó la sala puede hacer este paso.',actionLabel:'Volver al lobby',severity:'info'},MIN_PLAYERS_NOT_MET:{title:'Faltan personas para empezar',description:'Se necesitan al menos 3 participantes para iniciar la partida.',actionLabel:'Invitar al grupo',severity:'info'},PROMPTS_UNAVAILABLE:{title:'Preguntas no disponibles',description:'No cargamos suficientes preguntas ahora. Reintenta en un momento.',actionLabel:'Reintentar',severity:'error'},ROUND_STATE_INVALID:{title:'Estado de ronda desactualizado',description:'La ronda cambió mientras jugabas. Actualiza y seguimos.',actionLabel:'Actualizar pantalla',severity:'warning'},SUBMISSION_REJECTED:{title:'No pudimos guardar tu respuesta',description:'No pudimos registrar esa respuesta a tiempo. Inténtalo otra vez ahora.',actionLabel:'Reintentar',severity:'warning'},CONNECTION_LOST:{title:'Conexión inestable',description:'Perdimos sincronización en tiempo real. Estamos reintentando.',actionLabel:'Reintentar',severity:'warning'},SAVE_CURRENCY_FAILED:{title:'Monedas pendientes',description:'La partida cerró bien, pero algunas monedas siguen pendientes de guardarse.',actionLabel:'Volver a resultados',severity:'warning'},GUEST_CONVERSION_FAILED:{title:'Cuenta creada, progreso pendiente',description:'Tu cuenta está lista. El traspaso de progreso falló y puedes reintentarlo desde resultados.',actionLabel:'Ir a resultados',severity:'warning'},UNKNOWN:{title:'Ups, algo se enredó',description:'Tuvimos un problema técnico. Intenta de nuevo en unos segundos.',actionLabel:'Reintentar',severity:'error'}};
export const getErrorUX = (code: OrbitasErrorCode): OrbitasErrorUX => ({ code, ...ERROR_UX_MAP[code] });
