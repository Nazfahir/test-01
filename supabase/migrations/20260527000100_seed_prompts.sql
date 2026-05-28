insert into public.prompts (game_type, mode, content)
values
  ('would_you_rather', 'soft', '¿Qué prefieres: café eterno o té infinito?'),
  ('most_likely_to', 'soft', '¿Quién es más probable que llegue temprano por entusiasmo?'),
  ('dont_repeat', 'party', 'Di una excusa absurda para llegar tarde sin repetir ideas.')
on conflict do nothing;
