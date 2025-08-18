-- ===========================
-- POLICY CORRETTE (SENZA RICORSIONE)
-- ===========================

-- STRATEGIA: Usare controllo email hardcoded per admin invece di query ricorsiva
-- Alternativa: Usare JWT claims o auth.jwt() per evitare query sulla tabella utenti

-- UTENTI (CORRETTE)
DROP POLICY IF EXISTS utenti_select_admin_all ON public.utenti;
DROP POLICY IF EXISTS utenti_update_admin_any ON public.utenti;

CREATE POLICY utenti_select_self ON public.utenti
AS PERMISSIVE FOR SELECT
TO public
USING (auth.uid() = auth_id);

CREATE POLICY utenti_update_self ON public.utenti
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

-- ADMIN: Usa controllo email invece di query ricorsiva
CREATE POLICY utenti_select_admin_all ON public.utenti
AS PERMISSIVE FOR SELECT
TO public
USING (((current_setting('request.jwt.claims', true))::jsonb ->> 'email') = 'grafica.valeriobottiglieri@gmail.com');

CREATE POLICY utenti_update_admin_any ON public.utenti
AS PERMISSIVE FOR UPDATE
TO public
USING (((current_setting('request.jwt.claims', true))::jsonb ->> 'email') = 'grafica.valeriobottiglieri@gmail.com')
WITH CHECK (true);

CREATE POLICY utenti_insert_signup ON public.utenti
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() = auth_id AND ruolo = 'allievo');

-- ANNUNCI (CORRETTE)
CREATE POLICY annunci_read_public ON public.annunci
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY annunci_admin_write ON public.annunci
AS PERMISSIVE FOR ALL
TO public
USING (((current_setting('request.jwt.claims', true))::jsonb ->> 'email') = 'grafica.valeriobottiglieri@gmail.com')
WITH CHECK (((current_setting('request.jwt.claims', true))::jsonb ->> 'email') = 'grafica.valeriobottiglieri@gmail.com');

-- ISCRIZIONI (CORRETTE)
CREATE POLICY iscrizioni_select ON public.iscrizioni
AS PERMISSIVE FOR SELECT
TO public
USING (
  (utente_id IN (SELECT id FROM utenti WHERE auth_id = auth.uid()))
  OR ((current_setting('request.jwt.claims', true))::jsonb ->> 'email') = 'grafica.valeriobottiglieri@gmail.com'
);

CREATE POLICY iscrizioni_admin_write ON public.iscrizioni
AS PERMISSIVE FOR ALL
TO public
USING (((current_setting('request.jwt.claims', true))::jsonb ->> 'email') = 'grafica.valeriobottiglieri@gmail.com')
WITH CHECK (((current_setting('request.jwt.claims', true))::jsonb ->> 'email') = 'grafica.valeriobottiglieri@gmail.com');

-- PAGAMENTI (CORRETTE)
CREATE POLICY pagamenti_admin_full_access ON public.pagamenti
AS PERMISSIVE FOR ALL
TO public
USING (((current_setting('request.jwt.claims', true))::jsonb ->> 'email') = 'grafica.valeriobottiglieri@gmail.com');

-- CORSI (CORRETTE)
CREATE POLICY corsi_read_all ON public.corsi
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY corsi_admin_write ON public.corsi
AS PERMISSIVE FOR ALL
TO public
USING (((current_setting('request.jwt.claims', true))::jsonb ->> 'email') = 'grafica.valeriobottiglieri@gmail.com')
WITH CHECK (((current_setting('request.jwt.claims', true))::jsonb ->> 'email') = 'grafica.valeriobottiglieri@gmail.com');