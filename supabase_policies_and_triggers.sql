-- ===========================
-- FUNZIONI
-- ===========================

CREATE OR REPLACE FUNCTION public.protect_admin_fields()
RETURNS trigger AS $$
declare
  is_admin boolean;
begin
  -- Controllo ruolo admin dalla tabella utenti
  is_admin := EXISTS (
    SELECT 1 FROM utenti u
    WHERE u.auth_id = auth.uid() AND u.ruolo = 'admin'
  );

  IF NOT is_admin THEN
    IF (new.ruolo           is distinct from old.ruolo)
    OR (new.data_iscrizione is distinct from old.data_iscrizione)
    OR (new.corso_1         is distinct from old.corso_1)
    OR (new.corso_2         is distinct from old.corso_2)
    OR (new.corso_3         is distinct from old.corso_3)
    OR (new.corso_4         is distinct from old.corso_4)
    OR (new.corso_5         is distinct from old.corso_5)
    OR (new.prezzo_corso1   is distinct from old.prezzo_corso1)
    OR (new.prezzo_corso2   is distinct from old.prezzo_corso2)
    OR (new.prezzo_corso3   is distinct from old.prezzo_corso3)
    OR (new.prezzo_corso4   is distinct from old.prezzo_corso4)
    OR (new.prezzo_corso5   is distinct from old.prezzo_corso5)
    THEN
      RAISE EXCEPTION '⛔ Solo un admin può modificare corsi/prezzi/ruolo/data_iscrizione';
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.utenti (auth_id, nome, cognome, email, ruolo, data_iscrizione)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'cognome',
    NEW.email,
    'allievo',
    CURRENT_DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- TRIGGER
-- ===========================

DROP TRIGGER IF EXISTS trg_protect_admin_fields ON public.utenti;
CREATE TRIGGER trg_protect_admin_fields
BEFORE UPDATE ON public.utenti
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_fields();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ===========================
-- POLICY
-- ===========================

-- ANNUNCI
CREATE POLICY annunci_read_public ON public.annunci
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY annunci_admin_write ON public.annunci
AS PERMISSIVE FOR ALL
TO public
USING (EXISTS (SELECT 1 FROM utenti u WHERE u.auth_id = auth.uid() AND u.ruolo = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM utenti u WHERE u.auth_id = auth.uid() AND u.ruolo = 'admin'));

-- UTENTI
CREATE POLICY utenti_select_self ON public.utenti
AS PERMISSIVE FOR SELECT
TO public
USING (auth.uid() = auth_id);

CREATE POLICY utenti_update_self ON public.utenti
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

CREATE POLICY utenti_select_admin_all ON public.utenti
AS PERMISSIVE FOR SELECT
TO public
USING (auth.email() = 'grafica.valeriobottiglieri@gmail.com');

CREATE POLICY utenti_update_admin_any ON public.utenti
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.email() = 'grafica.valeriobottiglieri@gmail.com')
WITH CHECK (true);

CREATE POLICY utenti_insert_signup ON public.utenti
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() = auth_id AND ruolo = 'allievo');

-- ISCRIZIONI
CREATE POLICY iscrizioni_select ON public.iscrizioni
AS PERMISSIVE FOR SELECT
TO public
USING (
  (utente_id IN (SELECT id FROM utenti WHERE auth_id = auth.uid()))
  OR (auth.email() = 'grafica.valeriobottiglieri@gmail.com')
);

CREATE POLICY iscrizioni_admin_write ON public.iscrizioni
AS PERMISSIVE FOR ALL
TO public
USING (auth.email() = 'grafica.valeriobottiglieri@gmail.com')
WITH CHECK (auth.email() = 'grafica.valeriobottiglieri@gmail.com');

-- PAGAMENTI
CREATE POLICY pagamenti_admin_full_access ON public.pagamenti
AS PERMISSIVE FOR ALL
TO public
USING (auth.email() = 'grafica.valeriobottiglieri@gmail.com')
WITH CHECK (auth.email() = 'grafica.valeriobottiglieri@gmail.com');

-- CORSI
CREATE POLICY corsi_read_all ON public.corsi
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY corsi_admin_write ON public.corsi
AS PERMISSIVE FOR ALL
TO public
USING (auth.email() = 'grafica.valeriobottiglieri@gmail.com')
WITH CHECK (auth.email() = 'grafica.valeriobottiglieri@gmail.com');
