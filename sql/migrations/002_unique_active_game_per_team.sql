create unique index if not exists games_one_active_per_team_idx
on public.games (team_id)
where is_active = true;
