alter table public.prompts
  add column if not exists options jsonb;

update public.prompts
set options = jsonb_build_array('Café eterno', 'Té infinito')
where game_type = 'would_you_rather' and options is null;
