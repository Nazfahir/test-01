-- Complete MVP prompt coverage to 5 prompts per game_type + mode combination.
-- Together with 20260527000100_seed_prompts.sql, this leaves 30 prompts:
-- 3 minigames x 2 modes x 5 prompts.
insert into public.prompts (game_type, mode, content, options)
values
  -- Suave · Qué prefieres (4 more; initial seed already adds 1)
  ('would_you_rather', 'soft', '¿Qué prefieres para una tarde de lluvia tranquila?', '["Maratón de pelis", "Cocinar algo raro"]'::jsonb),
  ('would_you_rather', 'soft', '¿Qué prefieres adoptar por un día?', '["Una nube mini", "Un cactus dramático"]'::jsonb),
  ('would_you_rather', 'soft', '¿Qué prefieres encontrar en tu mochila?', '["Una galleta perfecta", "Una brújula para snacks"]'::jsonb),
  ('would_you_rather', 'soft', '¿Qué prefieres que suene cada vez que entras a una sala?', '["Campanitas suaves", "Aplausos de pingüinos"]'::jsonb),

  -- Suave · Quién es más probable (4 more; initial seed already adds 1)
  ('most_likely_to', 'soft', '¿Quién es más probable que traiga snacks para compartir?', '[]'::jsonb),
  ('most_likely_to', 'soft', '¿Quién es más probable que se haga amigo de un animal callejero?', '[]'::jsonb),
  ('most_likely_to', 'soft', '¿Quién es más probable que arme una playlist acogedora?', '[]'::jsonb),
  ('most_likely_to', 'soft', '¿Quién es más probable que recuerde el cumpleaños de una planta?', '[]'::jsonb),

  -- Suave · No repitas (initial seed had none, so add 5)
  ('dont_repeat', 'soft', 'Nombra una fruta de picnic sin repetir.', '[]'::jsonb),
  ('dont_repeat', 'soft', 'Nombra una comida para picnic sin repetir.', '[]'::jsonb),
  ('dont_repeat', 'soft', 'Nombra una película para ver un domingo sin repetir.', '[]'::jsonb),
  ('dont_repeat', 'soft', 'Nombra algo pequeño que da alegría sin repetir.', '[]'::jsonb),
  ('dont_repeat', 'soft', 'Nombra un objeto que llevarías a una cabaña sin repetir.', '[]'::jsonb),

  -- Fiesta · Qué prefieres (initial seed had none, so add 5)
  ('would_you_rather', 'party', '¿Qué prefieres llevar a una fiesta en la Luna?', '["Botas saltarinas", "Snacks anti-gravedad"]'::jsonb),
  ('would_you_rather', 'party', '¿Qué prefieres tener durante una fiesta espacial?', '["DJ robot", "Piñata meteorito"]'::jsonb),
  ('would_you_rather', 'party', '¿Qué prefieres que aparezca en medio de la sala?', '["Una máquina de burbujas", "Un pato con sombrero"]'::jsonb),
  ('would_you_rather', 'party', '¿Qué prefieres como transporte para llegar a una junta?', '["Patines cohete", "Alfombra confundida"]'::jsonb),
  ('would_you_rather', 'party', '¿Qué prefieres que todos tengan por diez minutos?', '["Voz de narrador", "Pasos con sonido de caricatura"]'::jsonb),

  -- Fiesta · Quién es más probable (initial seed had none, so add 5)
  ('most_likely_to', 'party', '¿Quién es más probable que invente un baile raro en diez segundos?', '[]'::jsonb),
  ('most_likely_to', 'party', '¿Quién es más probable que intente hablar con extraterrestres primero?', '[]'::jsonb),
  ('most_likely_to', 'party', '¿Quién es más probable que se convierta en alcalde de una fiesta?', '[]'::jsonb),
  ('most_likely_to', 'party', '¿Quién es más probable que arruine una misión secreta por reírse?', '[]'::jsonb),
  ('most_likely_to', 'party', '¿Quién es más probable que proponga una coreografía imposible?', '[]'::jsonb),

  -- Fiesta · No repitas (4 more; initial seed already adds 1)
  ('dont_repeat', 'party', 'Nombra algo que llevarías a una fiesta en otro planeta sin repetir.', '[]'::jsonb),
  ('dont_repeat', 'party', 'Nombra un poder mágico poco conveniente sin repetir.', '[]'::jsonb),
  ('dont_repeat', 'party', 'Nombra un ingrediente raro para una sopa galáctica sin repetir.', '[]'::jsonb),
  ('dont_repeat', 'party', 'Nombra un nombre para una banda de robots sin repetir.', '[]'::jsonb)
on conflict do nothing;
