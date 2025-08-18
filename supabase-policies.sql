-- RLS Policies (documentazione - non eseguite qui)

-- utenti
-- SELECT: using (auth.uid() = auth_id)
-- INSERT: with check (true)

-- Esempio (da applicare nel progetto Supabase):
-- alter table public.utenti enable row level security;
-- create policy "utenti_select_self" on public.utenti
--   for select using ( auth.uid() = auth_id );
-- create policy "utenti_insert_any" on public.utenti
--   for insert with check ( true );

-- pagamenti
-- SELECT: using (auth.uid() = auth_id
--   OR exists(select 1 from utenti u where u.auth_id = auth.uid() and u.ruolo = 'admin'))

-- Esempio:
-- alter table public.pagamenti enable row level security;
-- create policy "pagamenti_select_self_or_admin" on public.pagamenti
--   for select using (
--     auth.uid() = auth_id OR
--     exists(select 1 from public.utenti u where u.auth_id = auth.uid() and u.ruolo = 'admin')
--   );

-- annunci e eventi
-- SELECT aperta (pubblica).
-- INSERT/UPDATE/DELETE solo admin (ruolo admin come sopra).

-- Esempio:
-- alter table public.annunci enable row level security;
-- alter table public.eventi enable row level security;

-- create policy "annunci_select_all" on public.annunci for select using ( true );
-- create policy "eventi_select_all" on public.eventi for select using ( true );

-- create policy "annunci_write_admin" on public.annunci
--   for all using ( exists(select 1 from utenti u where u.auth_id = auth.uid() and u.ruolo = 'admin') )
--   with check ( exists(select 1 from utenti u where u.auth_id = auth.uid() and u.ruolo = 'admin') );

-- create policy "eventi_write_admin" on public.eventi
--   for all using ( exists(select 1 from utenti u where u.auth_id = auth.uid() and u.ruolo = 'admin') )
--   with check ( exists(select 1 from utenti u where u.auth_id = auth.uid() and u.ruolo = 'admin') );