alter table public.profiles
  add column if not exists display_name text;

update public.profiles
set display_name = coalesce(nullif(trim(display_name), ''), nullif(trim(username), ''), 'Jugador Orbitas')
where display_name is null or trim(display_name) = '';

alter table public.profiles
  alter column display_name set not null;

alter table public.profiles
  drop constraint if exists profiles_display_name_not_blank;

alter table public.profiles
  add constraint profiles_display_name_not_blank
  check (char_length(trim(display_name)) > 0);
