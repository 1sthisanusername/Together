-- ==============================================================================
-- ANNIVERSARY & MILESTONE ALERTS AND START DATE NOTIFICATIONS
-- Migration: 20261108000003_anniversary_milestones_and_alerts.sql
-- ==============================================================================

-- 1. Ensure couples table has start_date DATE column
ALTER TABLE public.couples 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- 2. Trigger: Notify partner when anniversary start_date is set or edited
CREATE OR REPLACE FUNCTION public.trg_notify_start_date_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_updater_id UUID := auth.uid();
  v_updater_name TEXT;
  v_partner_id UUID;
BEGIN
  -- Only trigger if start_date actually changed and updater is an authenticated user
  IF (OLD.start_date IS DISTINCT FROM NEW.start_date) AND v_updater_id IS NOT NULL THEN
    -- Find partner
    SELECT user_id INTO v_partner_id
    FROM public.couple_members
    WHERE couple_id = NEW.id AND user_id <> v_updater_id AND status = 'active'
    LIMIT 1;

    IF v_partner_id IS NOT NULL THEN
      SELECT COALESCE(display_name, 'Your partner') INTO v_updater_name
      FROM public.profiles WHERE id = v_updater_id;

      INSERT INTO public.notifications (
        recipient_id,
        couple_id,
        type,
        payload,
        deep_link,
        send_after
      ) VALUES (
        v_partner_id,
        NEW.id,
        'anniversary_date_updated',
        jsonb_build_object(
          'title', 'Anniversary Date Updated',
          'body', v_updater_name || ' updated your special anniversary date 💕',
          'start_date', NEW.start_date
        ),
        '/(tabs)/us',
        timezone('utc'::text, now())
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_couples_start_date_notify ON public.couples;
CREATE TRIGGER trg_couples_start_date_notify
  AFTER UPDATE OF start_date ON public.couples
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_start_date_changed();


-- 3. Scheduled Anniversary & Milestone Checker (pg_cron friendly)
CREATE OR REPLACE FUNCTION public.check_anniversaries_and_milestones()
RETURNS INT AS $$
DECLARE
  v_couple RECORD;
  v_member RECORD;
  v_days_together INT;
  v_is_anniversary BOOLEAN;
  v_is_milestone BOOLEAN;
  v_years INT;
  v_title TEXT;
  v_body TEXT;
  v_user_tz TEXT;
  v_send_time TIMESTAMPTZ;
  v_notif_count INT := 0;
BEGIN
  -- Loop through all active couples with a set start_date
  FOR v_couple IN
    SELECT c.id, c.start_date
    FROM public.couples c
    WHERE c.status = 'active' AND c.start_date IS NOT NULL
  LOOP
    v_days_together := CURRENT_DATE - v_couple.start_date;

    IF v_days_together <= 0 THEN
      CONTINUE;
    END IF;

    -- Check if today is an exact yearly anniversary
    v_is_anniversary := (
      EXTRACT(MONTH FROM v_couple.start_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND
      EXTRACT(DAY FROM v_couple.start_date) = EXTRACT(DAY FROM CURRENT_DATE)
    );
    v_years := EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM v_couple.start_date);

    -- Check milestone days: 100, 200, 365, 500, 1000, 1500, 2000, 2500, 3000, 5000
    v_is_milestone := v_days_together IN (100, 200, 365, 500, 1000, 1500, 2000, 2500, 3000, 5000);

    IF v_is_anniversary AND v_years > 0 THEN
      v_title := 'Happy Anniversary 💕';
      v_body := 'Celebrating ' || v_years || ' wonderful ' || 
                CASE WHEN v_years = 1 THEN 'year' ELSE 'years' END || 
                ' together today. Thank you for every shared moment.';
    ELSIF v_is_milestone THEN
      v_title := 'Milestone Day ✨';
      v_body := 'Today marks ' || v_days_together || ' days together side by side. Here is to all the days ahead.';
    ELSE
      CONTINUE;
    END IF;

    -- Send warm notification to both active partners at their local morning time
    FOR v_member IN
      SELECT cm.user_id, COALESCE(p.timezone, 'UTC') AS tz
      FROM public.couple_members cm
      JOIN public.profiles p ON p.id = cm.user_id
      WHERE cm.couple_id = v_couple.id AND cm.status = 'active'
    LOOP
      -- Calculate 9:00 AM today in user's timezone
      BEGIN
        v_send_time := (CURRENT_DATE::text || ' 09:00:00')::timestamp AT TIME ZONE v_member.tz;
      EXCEPTION WHEN OTHERS THEN
        v_send_time := timezone('utc'::text, now());
      END;

      -- If 9 AM local already passed, send now
      IF v_send_time < timezone('utc'::text, now()) THEN
        v_send_time := timezone('utc'::text, now());
      END IF;

      -- Avoid inserting duplicate alert for the same day
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE recipient_id = v_member.user_id
          AND couple_id = v_couple.id
          AND type IN ('anniversary_alert', 'milestone_alert')
          AND created_at >= CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (
          recipient_id,
          couple_id,
          type,
          payload,
          deep_link,
          send_after
        ) VALUES (
          v_member.user_id,
          v_couple.id,
          CASE WHEN v_is_anniversary THEN 'anniversary_alert' ELSE 'milestone_alert' END,
          jsonb_build_object(
            'title', v_title,
            'body', v_body,
            'days_together', v_days_together,
            'anniversary_year', v_years
          ),
          '/(tabs)/us',
          v_send_time
        );
        v_notif_count := v_notif_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_notif_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_anniversaries_and_milestones() TO authenticated, service_role;

-- 4. Enable pg_cron schedule if extension is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.schedule(
        'daily-anniversary-and-milestone-alerts',
        '0 8 * * *', -- Runs every morning at 8 AM UTC
        'SELECT public.check_anniversaries_and_milestones();'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

