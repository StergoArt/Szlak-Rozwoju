-- Audyt bezpieczenstwa 2026-03-23: Backend enforcement
-- B6: CHECK constraints na dlugosci kolumn
-- B7: BEFORE INSERT trigger na limit propozycji terminow

-- ============================================================
-- B6: Limity dlugosci kolumn (frontend maxlength to UX, nie security)
-- ============================================================

-- profiles: ograniczenie dlugosci imienia i telefonu
ALTER TABLE profiles
    ALTER COLUMN full_name TYPE VARCHAR(100),
    ALTER COLUMN phone TYPE VARCHAR(20);

-- notes: ograniczenie dlugosci tytulu i tresci
ALTER TABLE notes
    ADD CONSTRAINT notes_title_length CHECK (length(title) <= 200),
    ADD CONSTRAINT notes_content_length CHECK (length(content) <= 10000);

-- appointments: ograniczenie dlugosci notatek
ALTER TABLE appointments
    ADD CONSTRAINT appointments_notes_length CHECK (length(notes) <= 500);

-- ============================================================
-- B7: Limit propozycji terminow (max 5 aktywnych na klienta)
-- ============================================================

CREATE OR REPLACE FUNCTION check_max_requested_appointments()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'requested' THEN
        IF (SELECT count(*) FROM appointments
            WHERE client_id = NEW.client_id AND status = 'requested') >= 5 THEN
            RAISE EXCEPTION 'Maksymalna liczba aktywnych propozycji terminów (5) została osiągnięta.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_max_requested_appointments
    BEFORE INSERT ON appointments
    FOR EACH ROW
    WHEN (NEW.status = 'requested')
    EXECUTE FUNCTION check_max_requested_appointments();
