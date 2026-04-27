alter table public.games
  add column if not exists source_type text not null default 'manual',
  add column if not exists imported_at timestamptz,
  add column if not exists import_batch_id uuid;

alter table public.games
  drop constraint if exists games_source_type_check;

alter table public.games
  add constraint games_source_type_check check (source_type in ('manual', 'photo', 'screenshot', 'spreadsheet'));

create index if not exists games_import_batch_idx on public.games(import_batch_id);
