-- supabase/migrations/20260730_fix_personal_friend_ledger_and_rls.sql
-- Description: Fix RLS permissions for linked contacts & transactions, and enable automatic balance updates for both personal and business contacts.

-- 1. Fix RLS Policy on public.contacts to allow linked friends to read peer contact records
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can view own or linked contacts" ON public.contacts;

CREATE POLICY "Users can view own or linked contacts" ON public.contacts FOR SELECT
USING (
  auth.uid() = user_id
  OR
  auth.uid() = linked_user_id
);

-- 2. Fix RLS Policy on public.transactions to allow linked friends to view shared personal transactions
DROP POLICY IF EXISTS "Users can view own or involved transactions" ON public.transactions;

CREATE POLICY "Users can view own or involved transactions" ON public.transactions FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() IN (SELECT user_id FROM public.transaction_splits WHERE transaction_id = id)
  OR
  auth.uid() IN (SELECT linked_user_id FROM public.contacts WHERE id = contact_id)
);

-- 3. Replace update_contact_balance() function to support both BUSINESS and PERSONAL transactions
CREATE OR REPLACE FUNCTION public.update_contact_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_old_delta NUMERIC;
  v_new_delta NUMERIC;
  v_old_reciprocal_id UUID;
  v_new_reciprocal_id UUID;
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF NEW.contact_id IS NOT NULL THEN
      v_new_delta := CASE WHEN NEW.flow = 'OUT' THEN NEW.amount ELSE -NEW.amount END;

      -- Update local contact
      UPDATE public.contacts
      SET
        net_balance = net_balance + v_new_delta,
        transaction_count = COALESCE(transaction_count, 0) + 1,
        last_transaction_at = NEW.date
      WHERE id = NEW.contact_id;

      -- Update reciprocal contact if linked
      SELECT id INTO v_new_reciprocal_id
      FROM public.contacts
      WHERE user_id = (SELECT linked_user_id FROM public.contacts WHERE id = NEW.contact_id)
        AND linked_user_id = NEW.user_id
      LIMIT 1;

      IF v_new_reciprocal_id IS NOT NULL THEN
        UPDATE public.contacts
        SET
          net_balance = net_balance - v_new_delta,
          transaction_count = COALESCE(transaction_count, 0) + 1,
          last_transaction_at = NEW.date
        WHERE id = v_new_reciprocal_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    IF OLD.contact_id IS NOT NULL THEN
      v_old_delta := CASE WHEN OLD.flow = 'OUT' THEN OLD.amount ELSE -OLD.amount END;

      -- Update local contact
      UPDATE public.contacts
      SET
        net_balance = net_balance - v_old_delta,
        transaction_count = GREATEST(0, COALESCE(transaction_count, 1) - 1)
      WHERE id = OLD.contact_id;

      -- Update reciprocal contact if linked
      SELECT id INTO v_old_reciprocal_id
      FROM public.contacts
      WHERE user_id = (SELECT linked_user_id FROM public.contacts WHERE id = OLD.contact_id)
        AND linked_user_id = OLD.user_id
      LIMIT 1;

      IF v_old_reciprocal_id IS NOT NULL THEN
        UPDATE public.contacts
        SET
          net_balance = net_balance + v_old_delta,
          transaction_count = GREATEST(0, COALESCE(transaction_count, 1) - 1)
        WHERE id = v_old_reciprocal_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- Handle UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Reverse OLD effect
    IF OLD.contact_id IS NOT NULL THEN
      v_old_delta := CASE WHEN OLD.flow = 'OUT' THEN OLD.amount ELSE -OLD.amount END;

      UPDATE public.contacts
      SET net_balance = net_balance - v_old_delta
      WHERE id = OLD.contact_id;

      SELECT id INTO v_old_reciprocal_id
      FROM public.contacts
      WHERE user_id = (SELECT linked_user_id FROM public.contacts WHERE id = OLD.contact_id)
        AND linked_user_id = OLD.user_id
      LIMIT 1;

      IF v_old_reciprocal_id IS NOT NULL THEN
        UPDATE public.contacts
        SET net_balance = net_balance + v_old_delta
        WHERE id = v_old_reciprocal_id;
      END IF;
    END IF;

    -- Apply NEW effect
    IF NEW.contact_id IS NOT NULL THEN
      v_new_delta := CASE WHEN NEW.flow = 'OUT' THEN NEW.amount ELSE -NEW.amount END;

      UPDATE public.contacts
      SET
        net_balance = net_balance + v_new_delta,
        last_transaction_at = NEW.date
      WHERE id = NEW.contact_id;

      SELECT id INTO v_new_reciprocal_id
      FROM public.contacts
      WHERE user_id = (SELECT linked_user_id FROM public.contacts WHERE id = NEW.contact_id)
        AND linked_user_id = NEW.user_id
      LIMIT 1;

      IF v_new_reciprocal_id IS NOT NULL THEN
        UPDATE public.contacts
        SET
          net_balance = net_balance - v_new_delta,
          last_transaction_at = NEW.date
        WHERE id = v_new_reciprocal_id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS trigger_update_balance ON public.transactions;
CREATE TRIGGER trigger_update_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_contact_balance();

-- Recalculate net balances for all existing contacts
CREATE OR REPLACE FUNCTION public.recalculate_all_contact_balances()
RETURNS void AS $$
DECLARE
  r RECORD;
  v_net NUMERIC;
  v_count INT;
  v_last TIMESTAMPTZ;
  v_peer_net NUMERIC;
  v_peer_count INT;
  v_peer_last TIMESTAMPTZ;
BEGIN
  FOR r IN SELECT id, user_id, linked_user_id FROM public.contacts LOOP
    -- Compute balance from local transactions
    SELECT 
      COALESCE(SUM(CASE WHEN flow = 'OUT' THEN amount ELSE -amount END), 0),
      COUNT(*),
      MAX(date)
    INTO v_net, v_count, v_last
    FROM public.transactions
    WHERE contact_id = r.id;

    -- If linked to a peer, add peer's personal transactions shared with me (inverted)
    IF r.linked_user_id IS NOT NULL THEN
      SELECT 
        COALESCE(SUM(CASE WHEN t.flow = 'OUT' THEN -t.amount ELSE t.amount END), 0),
        COUNT(*),
        MAX(t.date)
      INTO v_peer_net, v_peer_count, v_peer_last
      FROM public.transactions t
      JOIN public.contacts c_peer ON t.contact_id = c_peer.id
      WHERE c_peer.user_id = r.linked_user_id
        AND c_peer.linked_user_id = r.user_id
        AND t.mode = 'PERSONAL';

      v_net := v_net + v_peer_net;
      v_count := v_count + v_peer_count;
      IF v_peer_last IS NOT NULL AND (v_last IS NULL OR v_peer_last > v_last) THEN
        v_last := v_peer_last;
      END IF;
    END IF;

    UPDATE public.contacts
    SET net_balance = v_net,
        transaction_count = v_count,
        last_transaction_at = v_last
    WHERE id = r.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT public.recalculate_all_contact_balances();
