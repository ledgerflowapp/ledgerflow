


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accept_contact_invite"("token" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    contact_record RECORD;
    owner_name TEXT;
    uid UUID;
    existing_friendship RECORD;
BEGIN
    uid := auth.uid();
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Find the contact by invite_token
    SELECT * INTO contact_record FROM public.contacts WHERE invite_token = token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invite token';
    END IF;

    -- Prevent self-invite
    IF contact_record.user_id = uid THEN
        RAISE EXCEPTION 'Cannot invite yourself';
    END IF;

    -- Get owner's name for return message
    SELECT full_name INTO owner_name FROM public.profiles WHERE id = contact_record.user_id;

    -- Check if friendship already exists
    SELECT * INTO existing_friendship FROM public.friendships 
    WHERE (user_id_1 = contact_record.user_id AND user_id_2 = uid)
       OR (user_id_1 = uid AND user_id_2 = contact_record.user_id);

    IF NOT FOUND THEN
        -- Insert friendship in deterministic order
        IF contact_record.user_id < uid THEN
            INSERT INTO public.friendships (user_id_1, user_id_2, status) 
            VALUES (contact_record.user_id, uid, 'ACCEPTED');
        ELSE
            INSERT INTO public.friendships (user_id_1, user_id_2, status) 
            VALUES (uid, contact_record.user_id, 'ACCEPTED');
        END IF;
    ELSE
        -- Update to ACCEPTED if it was PENDING
        IF existing_friendship.status = 'PENDING' THEN
            UPDATE public.friendships 
            SET status = 'ACCEPTED' 
            WHERE id = existing_friendship.id;
        END IF;
    END IF;

    -- Update the contact to link to the new user and consume the token
    UPDATE public.contacts 
    SET linked_user_id = uid,
        invite_token = NULL
    WHERE id = contact_record.id;

    RETURN json_build_object(
        'success', true,
        'owner_name', owner_name
    );
END;
$$;


ALTER FUNCTION "public"."accept_contact_invite"("token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_friend_invite"("invite_token" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    target_user RECORD;
    current_user_profile RECORD;
    uid UUID;
    existing_friendship RECORD;
BEGIN
    uid := auth.uid();
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Find the user who owns the invite token (User A)
    SELECT * INTO target_user FROM public.profiles WHERE friend_invite_token = invite_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invite link';
    END IF;

    -- Get current user profile (User B)
    SELECT * INTO current_user_profile FROM public.profiles WHERE id = uid;

    -- Prevent self-invite
    IF target_user.id = uid THEN
        RAISE EXCEPTION 'You cannot become friends with yourself';
    END IF;

    -- Check if friendship already exists
    SELECT * INTO existing_friendship FROM public.friendships 
    WHERE (user_id_1 = target_user.id AND user_id_2 = uid)
       OR (user_id_1 = uid AND user_id_2 = target_user.id);

    IF NOT FOUND THEN
        -- Insert friendship in deterministic order
        IF target_user.id < uid THEN
            INSERT INTO public.friendships (user_id_1, user_id_2, status) 
            VALUES (target_user.id, uid, 'ACCEPTED');
        ELSE
            INSERT INTO public.friendships (user_id_1, user_id_2, status) 
            VALUES (uid, target_user.id, 'ACCEPTED');
        END IF;
    ELSE
        -- Update to ACCEPTED if it was PENDING
        IF existing_friendship.status = 'PENDING' THEN
            UPDATE public.friendships 
            SET status = 'ACCEPTED' 
            WHERE id = existing_friendship.id;
        END IF;
    END IF;

    -- AUTO-CREATE MUTUAL CONTACTS
    -- 1. Create contact for Current User (User B) pointing to Target User (User A)
    IF NOT EXISTS (SELECT 1 FROM public.contacts WHERE user_id = uid AND linked_user_id = target_user.id) THEN
        INSERT INTO public.contacts (user_id, name, type, linked_user_id, image_url)
        VALUES (uid, target_user.full_name, 'OTHER', target_user.id, target_user.avatar_url);
    END IF;

    -- 2. Create contact for Target User (User A) pointing to Current User (User B)
    IF NOT EXISTS (SELECT 1 FROM public.contacts WHERE user_id = target_user.id AND linked_user_id = uid) THEN
        INSERT INTO public.contacts (user_id, name, type, linked_user_id, image_url)
        VALUES (target_user.id, current_user_profile.full_name, 'OTHER', uid, current_user_profile.avatar_url);
    END IF;

    RETURN json_build_object(
        'success', true,
        'target_name', target_user.full_name
    );
END;
$$;


ALTER FUNCTION "public"."accept_friend_invite"("invite_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_in_app_request"("p_friendship_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    uid uuid := auth.uid();
    f_record RECORD;
    sender_id uuid;
    sender_profile RECORD;
    current_user_profile RECORD;
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO f_record FROM public.friendships WHERE id = p_friendship_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Friend request not found';
    END IF;

    IF f_record.status = 'ACCEPTED' THEN
        RAISE EXCEPTION 'Friend request already accepted';
    END IF;

    -- Determine who is the sender and receiver
    IF f_record.initiator_id = uid THEN
        RAISE EXCEPTION 'You cannot accept your own request';
    END IF;
    
    sender_id := f_record.initiator_id;
    
    -- Verify the current user is the other person in the relationship
    IF (f_record.user_id_1 != uid AND f_record.user_id_2 != uid) THEN
        RAISE EXCEPTION 'You are not involved in this friend request';
    END IF;

    -- Update status
    UPDATE public.friendships SET status = 'ACCEPTED' WHERE id = p_friendship_id;

    -- Get profiles
    SELECT * INTO sender_profile FROM public.profiles WHERE id = sender_id;
    SELECT * INTO current_user_profile FROM public.profiles WHERE id = uid;

    -- Check if User B (receiver/current user) has a ghost contact for User A (sender)
    IF NOT EXISTS (SELECT 1 FROM public.contacts WHERE user_id = uid AND linked_user_id = sender_id) THEN
        -- Maybe they have an unlinked contact with matching phone number?
        IF sender_profile.phone IS NOT NULL AND EXISTS (SELECT 1 FROM public.contacts WHERE user_id = uid AND phone = sender_profile.phone AND linked_user_id IS NULL) THEN
            UPDATE public.contacts 
            SET linked_user_id = sender_id 
            WHERE id = (SELECT id FROM public.contacts WHERE user_id = uid AND phone = sender_profile.phone AND linked_user_id IS NULL LIMIT 1);
        ELSE
            -- Create a new mutual contact in B's book
            INSERT INTO public.contacts (user_id, name, type, linked_user_id, image_url)
            VALUES (uid, sender_profile.full_name, 'OTHER', sender_id, sender_profile.avatar_url);
        END IF;
    END IF;
    
    -- Note: Sender (User A) already linked their contact in send_friend_request, but let's ensure they have one just in case
    IF NOT EXISTS (SELECT 1 FROM public.contacts WHERE user_id = sender_id AND linked_user_id = uid) THEN
         INSERT INTO public.contacts (user_id, name, type, linked_user_id, image_url)
         VALUES (sender_id, current_user_profile.full_name, 'OTHER', uid, current_user_profile.avatar_url);
    END IF;

    RETURN json_build_object('success', true, 'sender_name', sender_profile.full_name);
END;
$$;


ALTER FUNCTION "public"."accept_in_app_request"("p_friendship_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_transaction_with_splits"("p_user_id" "uuid", "p_business_id" "uuid", "p_amount" numeric, "p_flow" "text", "p_mode" "text", "p_name" "text", "p_note" "text", "p_date" timestamp with time zone, "p_due_date" timestamp with time zone, "p_contact_id" "uuid", "p_category_id" "uuid", "p_account_id" "uuid", "p_group_id" "uuid", "p_payer_id" "uuid", "p_payer_group_member_id" "uuid", "p_split_type" "text", "p_splits" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_transaction_id  UUID;
  v_transaction     JSONB;
  v_split           JSONB;
BEGIN
  -- Validate caller owns this operation
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insert the transaction
  INSERT INTO public.transactions (
    user_id, business_id, amount, flow, mode, name, note,
    date, due_date, contact_id, category_id, account_id,
    group_id, payer_id, payer_group_member_id, split_type
  )
  VALUES (
    p_user_id, p_business_id, p_amount, p_flow, p_mode, p_name, p_note,
    p_date, p_due_date, p_contact_id, p_category_id, p_account_id,
    p_group_id, p_payer_id, p_payer_group_member_id, p_split_type
  )
  RETURNING id INTO v_transaction_id;

  -- Insert splits if any were provided
  IF p_splits IS NOT NULL AND jsonb_array_length(p_splits) > 0 THEN
    FOR v_split IN SELECT * FROM jsonb_array_elements(p_splits)
    LOOP
      INSERT INTO public.transaction_splits (
        transaction_id,
        user_id,
        group_member_id,
        amount,
        percentage,
        is_settled,
        member_name_snapshot
      )
      VALUES (
        v_transaction_id,
        (v_split->>'user_id')::UUID,
        (v_split->>'group_member_id')::UUID,
        (v_split->>'amount')::NUMERIC,
        (v_split->>'percentage')::NUMERIC,
        COALESCE((v_split->>'is_settled')::BOOLEAN, FALSE),
        v_split->>'member_name_snapshot'
      );
    END LOOP;
  END IF;

  -- Return the created transaction id
  RETURN jsonb_build_object('id', v_transaction_id);

EXCEPTION
  WHEN OTHERS THEN
    -- The entire block is automatically rolled back by Postgres on exception
    RAISE;
END;
$$;


ALTER FUNCTION "public"."add_transaction_with_splits"("p_user_id" "uuid", "p_business_id" "uuid", "p_amount" numeric, "p_flow" "text", "p_mode" "text", "p_name" "text", "p_note" "text", "p_date" timestamp with time zone, "p_due_date" timestamp with time zone, "p_contact_id" "uuid", "p_category_id" "uuid", "p_account_id" "uuid", "p_group_id" "uuid", "p_payer_id" "uuid", "p_payer_group_member_id" "uuid", "p_split_type" "text", "p_splits" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."contribute_to_goal"("p_goal_id" "uuid", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_target  NUMERIC;
  v_current NUMERIC;
  v_updated JSONB;
BEGIN
  -- Validate the goal belongs to the calling user
  IF NOT EXISTS (
    SELECT 1 FROM public.goals WHERE id = p_goal_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Goal not found or unauthorized';
  END IF;

  -- Read current and target amounts atomically (SELECT ... FOR UPDATE locks the row)
  SELECT target_amount, current_amount
    INTO v_target, v_current
    FROM public.goals
   WHERE id = p_goal_id AND user_id = auth.uid()
     FOR UPDATE;

  -- Guard: prevent over-contribution
  IF v_current + p_amount > v_target THEN
    RAISE EXCEPTION 'Contribution would exceed goal target';
  END IF;

  -- Atomic increment
  UPDATE public.goals
  SET current_amount = current_amount + p_amount
  WHERE id = p_goal_id AND user_id = auth.uid()
  RETURNING jsonb_build_object('id', id, 'current_amount', current_amount) INTO v_updated;

  RETURN v_updated;
END;
$$;


ALTER FUNCTION "public"."contribute_to_goal"("p_goal_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detect_user_by_phone"("p_phone" "text") RETURNS TABLE("id" "uuid", "full_name" "text", "avatar_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY 
    SELECT p.id, p.full_name, p.avatar_url 
    FROM public.profiles p
    WHERE p.phone = p_phone 
      AND p.discoverable_by_phone = true;
END;
$$;


ALTER FUNCTION "public"."detect_user_by_phone"("p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_group_by_invite"("invite_code_input" "uuid") RETURNS TABLE("group_id" "uuid", "group_name" "text", "group_avatar_url" "text", "ghost_members" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    target_group_id UUID;
    t_group_name TEXT;
    t_group_avatar TEXT;
BEGIN
    -- 1. Find Group
    SELECT g.id, g.name, g.avatar_url INTO target_group_id, t_group_name, t_group_avatar
    FROM public.groups g
    WHERE g.invite_code = invite_code_input;

    IF target_group_id IS NULL THEN
        RETURN; -- Returns empty if not found
    END IF;

    -- 2. Return details + list of unclaimed ghost members
    RETURN QUERY
    SELECT 
        target_group_id,
        t_group_name,
        t_group_avatar,
        (
            SELECT jsonb_agg(jsonb_build_object('id', gm.id, 'name', gm.ghost_name, 'avatar_url', gm.avatar_url))
            FROM public.group_members gm
            WHERE gm.group_id = target_group_id 
            AND gm.user_id IS NULL -- Only ghosts
        );
END;
$$;


ALTER FUNCTION "public"."get_group_by_invite"("invite_code_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monthly_category_spend"("p_user_id" "uuid", "p_month" integer, "p_year" integer) RETURNS TABLE("category_name" "text", "category_color" "text", "total_spent" numeric)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select 
    coalesce(c.name, 'Uncategorized') as category_name,
    coalesce(c.icon, '❓') as category_color,
    sum(t.amount) as total_spent
  from transactions t
  left join categories c on t.category_id = c.id
  where t.user_id = p_user_id
    and t.mode = 'PERSONAL'
    and t.flow = 'OUT'
    and extract(month from t.date) = p_month
    and extract(year from t.date) = p_year
  group by c.name, c.icon;
end;
$$;


ALTER FUNCTION "public"."get_monthly_category_spend"("p_user_id" "uuid", "p_month" integer, "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_group_ids"() RETURNS TABLE("group_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."get_my_group_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_group_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Always set created_by to the current user, preventing spoofing
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_group_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_transaction_creator"("txn_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = txn_id AND t.user_id = auth.uid());
END;
$$;


ALTER FUNCTION "public"."is_transaction_creator"("txn_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_group"("invite_code_input" "uuid", "claim_ghost_member_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    target_group_id UUID;
    v_user_id UUID := auth.uid();
    existing_member_id UUID;
BEGIN
    -- 1. Validate Invite Code
    SELECT id INTO target_group_id FROM public.groups WHERE invite_code = invite_code_input;
    IF target_group_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;

    -- 2. Check if already a member
    SELECT id INTO existing_member_id FROM public.group_members 
    WHERE group_id = target_group_id AND user_id = v_user_id;
    
    IF existing_member_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already a member', 'group_id', target_group_id);
    END IF;

    -- 3. Logic Branch: Claim Ghost vs Join New
    IF claim_ghost_member_id IS NOT NULL THEN
        -- Verify the ghost belongs to this group and is actually a ghost
        UPDATE public.group_members
        SET 
            user_id = v_user_id,
            ghost_name = NULL, -- Clear ghost name as it's now a real user
            joined_at = now()
        WHERE id = claim_ghost_member_id 
        AND group_id = target_group_id 
        AND user_id IS NULL;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ghost member not found or already claimed';
        END IF;
    ELSE
        -- Insert new member
        INSERT INTO public.group_members (group_id, user_id)
        VALUES (target_group_id, v_user_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'group_id', target_group_id);
END;
$$;


ALTER FUNCTION "public"."join_group"("invite_code_input" "uuid", "claim_ghost_member_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_ghost_to_friend"("p_group_id" "uuid", "p_ghost_member_id" "uuid", "p_friend_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_friend_exists_in_group BOOLEAN;
BEGIN
    -- 1. Check Permissions (Must be Group Creator)
    SELECT (created_by = auth.uid()) INTO v_is_admin
    FROM public.groups WHERE id = p_group_id;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Only group admin can link members';
    END IF;

    -- 2. Check if Friend is ALREADY in the group
    -- (Merging two existing members is too complex for V1, we abort)
    SELECT EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = p_group_id AND user_id = p_friend_user_id
    ) INTO v_friend_exists_in_group;

    IF v_friend_exists_in_group THEN
        RAISE EXCEPTION 'This friend is already a member of the group. Cannot merge.';
    END IF;

    -- 3. Perform the Link
    UPDATE public.group_members
    SET 
        user_id = p_friend_user_id,
        ghost_name = NULL, -- Remove ghost status
        avatar_url = NULL -- Reset to use profile avatar
    WHERE id = p_ghost_member_id
    AND group_id = p_group_id
    AND user_id IS NULL; -- Ensure target is actually a ghost

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ghost member not found';
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."link_ghost_to_friend"("p_group_id" "uuid", "p_ghost_member_id" "uuid", "p_friend_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_shared_transaction_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    target_linked_user_id uuid;
    deleter_name text;
BEGIN
    IF (OLD.contact_id IS NOT NULL) THEN
        SELECT linked_user_id INTO target_linked_user_id 
        FROM contacts WHERE id = OLD.contact_id;
        
        IF (target_linked_user_id IS NOT NULL) THEN
            -- Get the name of the user who deleted it (the local user)
            SELECT full_name INTO deleter_name FROM profiles WHERE id = auth.uid();
            
            IF deleter_name IS NULL THEN
                 deleter_name := 'A user';
            END IF;
            
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (
                target_linked_user_id, 
                'EXPENSE_ADDED', -- Reusing EXPENSE_ADDED or create a new type if preferred
                'Shared Transaction Deleted', 
                deleter_name || ' deleted a shared transaction: ' || OLD.name, 
                jsonb_build_object('transaction_id', OLD.id)
            );
        END IF;
    END IF;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."notify_on_shared_transaction_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_all_balances"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- 1. Reset all balances to 0
  UPDATE contacts SET net_balance = 0;
  UPDATE accounts SET balance = 0;

  -- 2. Re-sum Contacts
  -- Flow OUT -> Positive Balance (You act like a creditor)
  -- Flow IN -> Negative Balance (You act like a debtor)
  UPDATE contacts c
  SET net_balance = s.total
  FROM (
    SELECT contact_id, SUM(CASE WHEN flow = 'OUT' THEN amount ELSE -amount END) as total
    FROM transactions
    WHERE contact_id IS NOT NULL
    GROUP BY contact_id
  ) s
  WHERE c.id = s.contact_id;

  -- 3. Re-sum Accounts (Only Personal Mode)
  -- Flow IN -> Positive Balance (Income)
  -- Flow OUT -> Negative Balance (Expense)
  UPDATE accounts a
  SET balance = s.total
  FROM (
    SELECT account_id, SUM(CASE WHEN flow = 'IN' THEN amount ELSE -amount END) as total
    FROM transactions
    WHERE account_id IS NOT NULL AND mode = 'PERSONAL'
    GROUP BY account_id
  ) s
  WHERE a.id = s.account_id;

END;
$$;


ALTER FUNCTION "public"."recalculate_all_balances"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_all_contact_balances"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."recalculate_all_contact_balances"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_friend"("friend_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    uid UUID := auth.uid();
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Delete the mutual friendship record
    DELETE FROM public.friendships
    WHERE (user_id_1 = uid AND user_id_2 = friend_id)
       OR (user_id_1 = friend_id AND user_id_2 = uid);

    -- 2. Unlink contacts on both sides (Turns them back into ghost contacts to preserve ledger history)
    UPDATE public.contacts
    SET linked_user_id = NULL
    WHERE (user_id = uid AND linked_user_id = friend_id)
       OR (user_id = friend_id AND linked_user_id = uid);
END;
$$;


ALTER FUNCTION "public"."remove_friend"("friend_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_default_accounts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.accounts (user_id, name, type, balance, is_default)
  VALUES
    (new.id, 'Cash', 'CASH', 0, true),
    (new.id, 'Bank Account', 'BANK', 0, false)
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."seed_default_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_default_business"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.businesses (user_id, name)
  VALUES (new.id, 'My Business')
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."seed_default_business"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_default_categories"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, type, active)
  VALUES
    (new.id, 'Food', '🍔', 'EXPENSE', true),
    (new.id, 'Transport', '🚗', 'EXPENSE', true),
    (new.id, 'Shopping', '🛍️', 'EXPENSE', true),
    (new.id, 'Entertainment', '🎬', 'EXPENSE', true),
    (new.id, 'Bills', '💡', 'EXPENSE', true),
    (new.id, 'Health', '🏥', 'EXPENSE', true),
    (new.id, 'Education', '📚', 'EXPENSE', true),
    (new.id, 'Groceries', '🛒', 'EXPENSE', true),
    (new.id, 'Rent', '🏠', 'EXPENSE', true),
    (new.id, 'Utilities', '⚡', 'EXPENSE', true),
    (new.id, 'Insurance', '🛡️', 'EXPENSE', true),
    (new.id, 'Savings', '💰', 'EXPENSE', true),
    (new.id, 'Investment', '📈', 'EXPENSE', true),
    (new.id, 'Gifts', '🎁', 'EXPENSE', true),
    (new.id, 'Travel', '✈️', 'EXPENSE', true),
    (new.id, 'Fuel', '⛽', 'EXPENSE', true),
    (new.id, 'Maintenance', '🔧', 'EXPENSE', true),
    (new.id, 'Pets', '🐾', 'EXPENSE', true),
    (new.id, 'Kids', '🧸', 'EXPENSE', true),
    (new.id, 'Salary', '💵', 'INCOME', true),
    (new.id, 'Business', '💼', 'INCOME', true),
    (new.id, 'Interest', '🏦', 'INCOME', true)
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."seed_default_categories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_default_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."seed_default_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_friend_request"("p_target_user_id" "uuid", "p_contact_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    uid uuid := auth.uid();
    existing_friendship RECORD;
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Prevent self-request
    IF uid = p_target_user_id THEN
        RAISE EXCEPTION 'Cannot send a friend request to yourself';
    END IF;
    
    -- Check if friendship already exists
    SELECT * INTO existing_friendship FROM public.friendships 
    WHERE (user_id_1 = p_target_user_id AND user_id_2 = uid)
       OR (user_id_1 = uid AND user_id_2 = p_target_user_id);
       
    IF FOUND THEN
        IF existing_friendship.status = 'ACCEPTED' THEN
            RAISE EXCEPTION 'You are already friends with this user';
        ELSE
            RAISE EXCEPTION 'A friend request is already pending';
        END IF;
    END IF;

    -- Insert pending friendship in deterministic order
    IF p_target_user_id < uid THEN
        INSERT INTO public.friendships (user_id_1, user_id_2, status, initiator_id) 
        VALUES (p_target_user_id, uid, 'PENDING', uid);
    ELSE
        INSERT INTO public.friendships (user_id_1, user_id_2, status, initiator_id) 
        VALUES (uid, p_target_user_id, 'PENDING', uid);
    END IF;

    -- Link the local contact to the target user
    IF p_contact_id IS NOT NULL THEN
        UPDATE public.contacts
        SET linked_user_id = p_target_user_id
        WHERE id = p_contact_id AND user_id = uid;
    END IF;

    -- Create a notification for the target user
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        p_target_user_id, 
        'FRIEND_REQ', 
        'New Friend Request', 
        'Someone wants to connect with you.', 
        jsonb_build_object('initiator_id', uid)
    );

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."send_friend_request"("p_target_user_id" "uuid", "p_contact_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_account_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Logic for INSERT
  IF (TG_OP = 'INSERT' AND NEW.mode = 'PERSONAL' AND NEW.account_id IS NOT NULL) THEN
    UPDATE accounts
    SET 
      balance = balance + (CASE WHEN NEW.flow = 'IN' THEN NEW.amount ELSE -NEW.amount END)
    WHERE id = NEW.account_id;
  END IF;

  -- Logic for UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Reverse OLD
    IF (OLD.mode = 'PERSONAL' AND OLD.account_id IS NOT NULL) THEN
      UPDATE accounts
      SET balance = balance - (CASE WHEN OLD.flow = 'IN' THEN OLD.amount ELSE -OLD.amount END)
      WHERE id = OLD.account_id;
    END IF;

    -- Apply NEW
    IF (NEW.mode = 'PERSONAL' AND NEW.account_id IS NOT NULL) THEN
      UPDATE accounts
      SET balance = balance + (CASE WHEN NEW.flow = 'IN' THEN NEW.amount ELSE -NEW.amount END)
      WHERE id = NEW.account_id;
    END IF;
  END IF;

  -- Logic for DELETE
  IF (TG_OP = 'DELETE' AND OLD.mode = 'PERSONAL' AND OLD.account_id IS NOT NULL) THEN
    UPDATE accounts
    SET balance = balance - (CASE WHEN OLD.flow = 'IN' THEN OLD.amount ELSE -OLD.amount END)
    WHERE id = OLD.account_id;
  END IF;
  
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_account_balance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_contact_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_contact_balance"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "balance" numeric DEFAULT 0.00,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "accounts_type_check" CHECK (("type" = ANY (ARRAY['CASH'::"text", 'BANK'::"text", 'WALLET'::"text", 'OTHER'::"text"])))
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."businesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text",
    "type" "text",
    "budget_limit" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "active" boolean DEFAULT true,
    CONSTRAINT "categories_type_check" CHECK (("type" = ANY (ARRAY['INCOME'::"text", 'EXPENSE'::"text"])))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "type" "text",
    "net_balance" numeric DEFAULT 0.00,
    "last_transaction_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "business_id" "uuid",
    "image_url" "text",
    "transaction_count" integer DEFAULT 0,
    "invite_token" "uuid" DEFAULT "gen_random_uuid"(),
    "linked_user_id" "uuid",
    CONSTRAINT "contacts_type_check" CHECK (("type" = ANY (ARRAY['CUSTOMER'::"text", 'SUPPLIER'::"text", 'OTHER'::"text"])))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id_1" "uuid",
    "user_id_2" "uuid",
    "status" "text",
    "initiator_id" "uuid",
    CONSTRAINT "check_user_order" CHECK (("user_id_1" < "user_id_2")),
    CONSTRAINT "friendships_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'ACCEPTED'::"text"])))
);


ALTER TABLE "public"."friendships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "target_amount" numeric NOT NULL,
    "current_amount" numeric DEFAULT 0,
    "deadline" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "goals_current_amount_check" CHECK (("current_amount" >= (0)::numeric)),
    CONSTRAINT "goals_target_amount_check" CHECK (("target_amount" > (0)::numeric))
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "ghost_name" "text",
    "avatar_url" "text",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_user_or_ghost" CHECK ((("user_id" IS NOT NULL) OR ("ghost_name" IS NOT NULL)))
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "uuid",
    "avatar_url" "text",
    "type" "text" DEFAULT 'GENERAL'::"text",
    "invite_code" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text",
    "title" "text",
    "message" "text",
    "data" "jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['FRIEND_REQ'::"text", 'GROUP_INVITE'::"text", 'EXPENSE_ADDED'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "business_name" "text",
    "currency_symbol" "text" DEFAULT '₹'::"text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "avatar_url" "text",
    "username" "text",
    "email" "text",
    "discoverable_by_phone" boolean DEFAULT true,
    "discoverable_by_username" boolean DEFAULT true,
    "friend_invite_token" "uuid" DEFAULT "gen_random_uuid"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recurring_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "flow" "text" DEFAULT 'OUT'::"text",
    "category_id" "uuid",
    "account_id" "uuid",
    "frequency" "text" NOT NULL,
    "start_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "next_run_date" timestamp with time zone NOT NULL,
    "last_run_date" timestamp with time zone,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "note" "text",
    CONSTRAINT "recurring_transactions_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "recurring_transactions_flow_check" CHECK (("flow" = ANY (ARRAY['IN'::"text", 'OUT'::"text"]))),
    CONSTRAINT "recurring_transactions_frequency_check" CHECK (("frequency" = ANY (ARRAY['DAILY'::"text", 'WEEKLY'::"text", 'MONTHLY'::"text", 'YEARLY'::"text"])))
);


ALTER TABLE "public"."recurring_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_splits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_id" "uuid",
    "user_id" "uuid",
    "group_member_id" "uuid",
    "amount" numeric NOT NULL,
    "percentage" numeric,
    "is_settled" boolean DEFAULT false,
    "member_name_snapshot" "text"
);


ALTER TABLE "public"."transaction_splits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "flow" "text",
    "mode" "text",
    "contact_id" "uuid",
    "category_id" "uuid",
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attachment_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "account_id" "uuid",
    "due_date" timestamp with time zone,
    "business_id" "uuid",
    "name" "text" NOT NULL,
    "note" "text",
    "group_id" "uuid",
    "payer_id" "uuid",
    "split_type" "text" DEFAULT 'EQUALLY'::"text",
    "payer_group_member_id" "uuid",
    CONSTRAINT "transactions_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "transactions_flow_check" CHECK (("flow" = ANY (ARRAY['IN'::"text", 'OUT'::"text"]))),
    CONSTRAINT "transactions_mode_check" CHECK (("mode" = ANY (ARRAY['BUSINESS'::"text", 'PERSONAL'::"text"]))),
    CONSTRAINT "transactions_split_type_check" CHECK (("split_type" = ANY (ARRAY['EQUALLY'::"text", 'BY_AMOUNT'::"text", 'BY_PERCENTAGE'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."unified_contact_transactions" AS
 SELECT "t"."id",
    "t"."user_id",
    "t"."amount",
    "t"."flow",
    "t"."mode",
    "t"."contact_id",
    "t"."category_id",
    "t"."date",
    "t"."attachment_url",
    "t"."created_at",
    "t"."account_id",
    "t"."due_date",
    "t"."business_id",
    "t"."name",
    "t"."note",
    "t"."group_id",
    "t"."payer_id",
    "t"."split_type",
    "t"."payer_group_member_id",
    "t"."contact_id" AS "local_contact_id",
    "t"."flow" AS "local_flow"
   FROM "public"."transactions" "t"
  WHERE ("t"."user_id" = "auth"."uid"())
UNION ALL
 SELECT "t"."id",
    "t"."user_id",
    "t"."amount",
    "t"."flow",
    "t"."mode",
    "t"."contact_id",
    "t"."category_id",
    "t"."date",
    "t"."attachment_url",
    "t"."created_at",
    "t"."account_id",
    "t"."due_date",
    "t"."business_id",
    "t"."name",
    "t"."note",
    "t"."group_id",
    "t"."payer_id",
    "t"."split_type",
    "t"."payer_group_member_id",
    "c_my"."id" AS "local_contact_id",
        CASE
            WHEN ("t"."flow" = 'IN'::"text") THEN 'OUT'::"text"
            ELSE 'IN'::"text"
        END AS "local_flow"
   FROM (("public"."transactions" "t"
     JOIN "public"."contacts" "c_peer" ON (("t"."contact_id" = "c_peer"."id")))
     JOIN "public"."contacts" "c_my" ON ((("c_my"."linked_user_id" = "c_peer"."user_id") AND ("c_my"."user_id" = "auth"."uid"()))))
  WHERE (("t"."user_id" = "c_peer"."user_id") AND ("c_peer"."linked_user_id" = "auth"."uid"()) AND ("t"."mode" = 'PERSONAL'::"text"));


ALTER VIEW "public"."unified_contact_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "business_theme" "text" DEFAULT 'light'::"text",
    "personal_theme" "text" DEFAULT 'dark'::"text",
    "business_accent" "text" DEFAULT 'blue'::"text",
    "personal_accent" "text" DEFAULT 'green'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sync_themes" boolean DEFAULT false,
    CONSTRAINT "user_settings_business_theme_check" CHECK (("business_theme" = ANY (ARRAY['light'::"text", 'dark'::"text"]))),
    CONSTRAINT "user_settings_personal_theme_check" CHECK (("personal_theme" = ANY (ARRAY['light'::"text", 'dark'::"text"])))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_invite_token_key" UNIQUE ("invite_token");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_user_id_key" UNIQUE ("group_id", "user_id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_friend_invite_token_key" UNIQUE ("friend_invite_token");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."recurring_transactions"
    ADD CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_splits"
    ADD CONSTRAINT "transaction_splits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "accounts_user_id_idx" ON "public"."accounts" USING "btree" ("user_id");



CREATE INDEX "businesses_user_id_idx" ON "public"."businesses" USING "btree" ("user_id");



CREATE INDEX "categories_active_idx" ON "public"."categories" USING "btree" ("active");



CREATE INDEX "categories_user_id_idx" ON "public"."categories" USING "btree" ("user_id");



CREATE INDEX "contacts_type_idx" ON "public"."contacts" USING "btree" ("type");



CREATE INDEX "contacts_user_id_idx" ON "public"."contacts" USING "btree" ("user_id");



CREATE INDEX "goals_user_id_idx" ON "public"."goals" USING "btree" ("user_id");



CREATE INDEX "recurring_transactions_account_id_idx" ON "public"."recurring_transactions" USING "btree" ("account_id");



CREATE INDEX "recurring_transactions_category_id_idx" ON "public"."recurring_transactions" USING "btree" ("category_id");



CREATE INDEX "recurring_transactions_user_id_idx" ON "public"."recurring_transactions" USING "btree" ("user_id");



CREATE INDEX "transactions_account_id_idx" ON "public"."transactions" USING "btree" ("account_id");



CREATE INDEX "transactions_analytics_idx" ON "public"."transactions" USING "btree" ("user_id", "mode", "date");



CREATE INDEX "transactions_business_id_idx" ON "public"."transactions" USING "btree" ("business_id");



CREATE INDEX "transactions_category_id_idx" ON "public"."transactions" USING "btree" ("category_id");



CREATE INDEX "transactions_contact_id_idx" ON "public"."transactions" USING "btree" ("contact_id");



CREATE INDEX "transactions_mode_idx" ON "public"."transactions" USING "btree" ("mode");



CREATE INDEX "transactions_user_id_date_idx" ON "public"."transactions" USING "btree" ("user_id", "date");



CREATE OR REPLACE TRIGGER "on_transaction_delete" AFTER DELETE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_shared_transaction_delete"();



CREATE OR REPLACE TRIGGER "on_user_settings_updated" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_group_created_by" BEFORE INSERT ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."handle_group_creation"();



CREATE OR REPLACE TRIGGER "trigger_update_account_balance" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_account_balance"();



CREATE OR REPLACE TRIGGER "trigger_update_balance" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_contact_balance"();



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user_id_1_fkey" FOREIGN KEY ("user_id_1") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user_id_2_fkey" FOREIGN KEY ("user_id_2") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurring_transactions"
    ADD CONSTRAINT "recurring_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recurring_transactions"
    ADD CONSTRAINT "recurring_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recurring_transactions"
    ADD CONSTRAINT "recurring_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_splits"
    ADD CONSTRAINT "transaction_splits_group_member_id_fkey" FOREIGN KEY ("group_member_id") REFERENCES "public"."group_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transaction_splits"
    ADD CONSTRAINT "transaction_splits_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_splits"
    ADD CONSTRAINT "transaction_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_payer_group_member_id_fkey" FOREIGN KEY ("payer_group_member_id") REFERENCES "public"."group_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can add members" ON "public"."group_members" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."groups"
  WHERE (("groups"."id" = "group_members"."group_id") AND ("groups"."created_by" = "auth"."uid"())))) OR ("group_id" IN ( SELECT "get_my_group_ids"."group_id"
   FROM "public"."get_my_group_ids"() "get_my_group_ids"("group_id")))));



CREATE POLICY "Admins or Self can remove members" ON "public"."group_members" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."groups"
  WHERE (("groups"."id" = "group_members"."group_id") AND ("groups"."created_by" = "auth"."uid"())))) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Authenticated users can create groups" ON "public"."groups" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Creators can delete splits" ON "public"."transaction_splits" FOR DELETE USING ("public"."is_transaction_creator"("transaction_id"));



CREATE POLICY "Creators can insert splits" ON "public"."transaction_splits" FOR INSERT WITH CHECK ("public"."is_transaction_creator"("transaction_id"));



CREATE POLICY "Creators can update splits" ON "public"."transaction_splits" FOR UPDATE USING ("public"."is_transaction_creator"("transaction_id"));



CREATE POLICY "Members can view group roster" ON "public"."group_members" FOR SELECT USING (("group_id" IN ( SELECT "get_my_group_ids"."group_id"
   FROM "public"."get_my_group_ids"() "get_my_group_ids"("group_id"))));



CREATE POLICY "Members or Creator can delete groups" ON "public"."groups" FOR DELETE USING ((("id" IN ( SELECT "get_my_group_ids"."group_id"
   FROM "public"."get_my_group_ids"() "get_my_group_ids"("group_id"))) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Members or Creator can update groups" ON "public"."groups" FOR UPDATE USING ((("id" IN ( SELECT "get_my_group_ids"."group_id"
   FROM "public"."get_my_group_ids"() "get_my_group_ids"("group_id"))) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Members or Creator can view groups" ON "public"."groups" FOR SELECT USING ((("id" IN ( SELECT "get_my_group_ids"."group_id"
   FROM "public"."get_my_group_ids"() "get_my_group_ids"("group_id"))) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Users can delete own accounts" ON "public"."accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own businesses" ON "public"."businesses" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own categories" ON "public"."categories" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own contacts" ON "public"."contacts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own goals" ON "public"."goals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own recurring transactions" ON "public"."recurring_transactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own transactions" ON "public"."transactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own accounts" ON "public"."accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own businesses" ON "public"."businesses" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own categories" ON "public"."categories" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own contacts" ON "public"."contacts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own goals" ON "public"."goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own recurring transactions" ON "public"."recurring_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own settings" ON "public"."user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own accounts" ON "public"."accounts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own businesses" ON "public"."businesses" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own categories" ON "public"."categories" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own contacts" ON "public"."contacts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own goals" ON "public"."goals" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own recurring transactions" ON "public"."recurring_transactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own transactions" ON "public"."transactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own accounts" ON "public"."accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own businesses" ON "public"."businesses" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own categories" ON "public"."categories" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own goals" ON "public"."goals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own or involved transactions" ON "public"."transactions" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() IN ( SELECT "transaction_splits"."user_id"
   FROM "public"."transaction_splits"
  WHERE ("transaction_splits"."transaction_id" = "transaction_splits"."id"))) OR ("auth"."uid"() IN ( SELECT "contacts"."linked_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."id" = "transactions"."contact_id")))));



CREATE POLICY "Users can view own or linked contacts" ON "public"."contacts" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "linked_user_id")));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own recurring transactions" ON "public"."recurring_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their friendships" ON "public"."friendships" FOR SELECT USING ((("auth"."uid"() = "user_id_1") OR ("auth"."uid"() = "user_id_2")));



CREATE POLICY "View splits if creator or involved" ON "public"."transaction_splits" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_transaction_creator"("transaction_id")));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."businesses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recurring_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_splits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."accept_contact_invite"("token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_contact_invite"("token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_contact_invite"("token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_friend_invite"("invite_token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_friend_invite"("invite_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_friend_invite"("invite_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_in_app_request"("p_friendship_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_in_app_request"("p_friendship_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_in_app_request"("p_friendship_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."add_transaction_with_splits"("p_user_id" "uuid", "p_business_id" "uuid", "p_amount" numeric, "p_flow" "text", "p_mode" "text", "p_name" "text", "p_note" "text", "p_date" timestamp with time zone, "p_due_date" timestamp with time zone, "p_contact_id" "uuid", "p_category_id" "uuid", "p_account_id" "uuid", "p_group_id" "uuid", "p_payer_id" "uuid", "p_payer_group_member_id" "uuid", "p_split_type" "text", "p_splits" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_transaction_with_splits"("p_user_id" "uuid", "p_business_id" "uuid", "p_amount" numeric, "p_flow" "text", "p_mode" "text", "p_name" "text", "p_note" "text", "p_date" timestamp with time zone, "p_due_date" timestamp with time zone, "p_contact_id" "uuid", "p_category_id" "uuid", "p_account_id" "uuid", "p_group_id" "uuid", "p_payer_id" "uuid", "p_payer_group_member_id" "uuid", "p_split_type" "text", "p_splits" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_transaction_with_splits"("p_user_id" "uuid", "p_business_id" "uuid", "p_amount" numeric, "p_flow" "text", "p_mode" "text", "p_name" "text", "p_note" "text", "p_date" timestamp with time zone, "p_due_date" timestamp with time zone, "p_contact_id" "uuid", "p_category_id" "uuid", "p_account_id" "uuid", "p_group_id" "uuid", "p_payer_id" "uuid", "p_payer_group_member_id" "uuid", "p_split_type" "text", "p_splits" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_transaction_with_splits"("p_user_id" "uuid", "p_business_id" "uuid", "p_amount" numeric, "p_flow" "text", "p_mode" "text", "p_name" "text", "p_note" "text", "p_date" timestamp with time zone, "p_due_date" timestamp with time zone, "p_contact_id" "uuid", "p_category_id" "uuid", "p_account_id" "uuid", "p_group_id" "uuid", "p_payer_id" "uuid", "p_payer_group_member_id" "uuid", "p_split_type" "text", "p_splits" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."contribute_to_goal"("p_goal_id" "uuid", "p_amount" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."contribute_to_goal"("p_goal_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."contribute_to_goal"("p_goal_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."contribute_to_goal"("p_goal_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."detect_user_by_phone"("p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."detect_user_by_phone"("p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_user_by_phone"("p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_group_by_invite"("invite_code_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_group_by_invite"("invite_code_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_group_by_invite"("invite_code_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monthly_category_spend"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_monthly_category_spend"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monthly_category_spend"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_group_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_group_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_group_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_group_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_group_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_group_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_transaction_creator"("txn_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_transaction_creator"("txn_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_transaction_creator"("txn_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."join_group"("invite_code_input" "uuid", "claim_ghost_member_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."join_group"("invite_code_input" "uuid", "claim_ghost_member_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_group"("invite_code_input" "uuid", "claim_ghost_member_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."link_ghost_to_friend"("p_group_id" "uuid", "p_ghost_member_id" "uuid", "p_friend_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."link_ghost_to_friend"("p_group_id" "uuid", "p_ghost_member_id" "uuid", "p_friend_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_ghost_to_friend"("p_group_id" "uuid", "p_ghost_member_id" "uuid", "p_friend_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_on_shared_transaction_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_shared_transaction_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_shared_transaction_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_all_balances"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_all_balances"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_all_balances"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_all_contact_balances"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_all_contact_balances"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_all_contact_balances"() TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_friend"("friend_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_friend"("friend_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_friend"("friend_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_default_accounts"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_default_accounts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_default_accounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_default_business"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_default_business"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_default_business"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_default_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_default_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_default_categories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_default_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_default_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_default_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_friend_request"("p_target_user_id" "uuid", "p_contact_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."send_friend_request"("p_target_user_id" "uuid", "p_contact_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_friend_request"("p_target_user_id" "uuid", "p_contact_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_account_balance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_account_balance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_account_balance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_contact_balance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_contact_balance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_contact_balance"() TO "service_role";
























GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."businesses" TO "anon";
GRANT ALL ON TABLE "public"."businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."friendships" TO "anon";
GRANT ALL ON TABLE "public"."friendships" TO "authenticated";
GRANT ALL ON TABLE "public"."friendships" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recurring_transactions" TO "anon";
GRANT ALL ON TABLE "public"."recurring_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."recurring_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_splits" TO "anon";
GRANT ALL ON TABLE "public"."transaction_splits" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_splits" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."unified_contact_transactions" TO "anon";
GRANT ALL ON TABLE "public"."unified_contact_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_contact_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_seed_accounts AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.seed_default_accounts();

CREATE TRIGGER on_auth_user_created_seed_business AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.seed_default_business();

CREATE TRIGGER on_auth_user_created_seed_categories AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.seed_default_categories();

CREATE TRIGGER on_auth_user_created_seed_settings AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.seed_default_settings();


  create policy "Public Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Users can delete own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update own avatar"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



