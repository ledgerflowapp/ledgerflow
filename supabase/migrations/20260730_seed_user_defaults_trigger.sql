-- Migration: 20260730_seed_user_defaults_trigger.sql
-- Description: Ensure default accounts, categories, settings, and business are seeded when a new auth user is created, and backfill existing users without accounts/categories.

-- 1. Create seed_default_categories function & trigger
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- 2. Create seed_default_accounts function & trigger
CREATE OR REPLACE FUNCTION public.seed_default_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- 3. Create seed_default_business function & trigger
CREATE OR REPLACE FUNCTION public.seed_default_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.businesses (user_id, name)
  VALUES (new.id, 'My Business')
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

-- 4. Create seed_default_settings function & trigger
CREATE OR REPLACE FUNCTION public.seed_default_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

-- Drop existing triggers if present and re-create them
DROP TRIGGER IF EXISTS on_auth_user_created_seed_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_seed_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.seed_default_categories();

DROP TRIGGER IF EXISTS on_auth_user_created_seed_accounts ON auth.users;
CREATE TRIGGER on_auth_user_created_seed_accounts
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.seed_default_accounts();

DROP TRIGGER IF EXISTS on_auth_user_created_seed_business ON auth.users;
CREATE TRIGGER on_auth_user_created_seed_business
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.seed_default_business();

DROP TRIGGER IF EXISTS on_auth_user_created_seed_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_seed_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.seed_default_settings();

-- Backfill existing users in public.profiles who are missing default accounts
INSERT INTO public.accounts (user_id, name, type, balance, is_default)
SELECT p.id, 'Cash', 'CASH', 0, true
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.accounts a WHERE a.user_id = p.id);

INSERT INTO public.accounts (user_id, name, type, balance, is_default)
SELECT p.id, 'Bank Account', 'BANK', 0, false
FROM public.profiles p
WHERE (SELECT count(*) FROM public.accounts a WHERE a.user_id = p.id) = 1
  AND NOT EXISTS (SELECT 1 FROM public.accounts a WHERE a.user_id = p.id AND a.name = 'Bank Account');

-- Backfill existing users in public.profiles who are missing categories
INSERT INTO public.categories (user_id, name, icon, type, active)
SELECT p.id, c.name, c.icon, c.type, true
FROM public.profiles p
CROSS JOIN (
  VALUES
    ('Food', '🍔', 'EXPENSE'),
    ('Transport', '🚗', 'EXPENSE'),
    ('Shopping', '🛍️', 'EXPENSE'),
    ('Entertainment', '🎬', 'EXPENSE'),
    ('Bills', '💡', 'EXPENSE'),
    ('Health', '🏥', 'EXPENSE'),
    ('Education', '📚', 'EXPENSE'),
    ('Groceries', '🛒', 'EXPENSE'),
    ('Rent', '🏠', 'EXPENSE'),
    ('Utilities', '⚡', 'EXPENSE'),
    ('Insurance', '🛡️', 'EXPENSE'),
    ('Savings', '💰', 'EXPENSE'),
    ('Investment', '📈', 'EXPENSE'),
    ('Gifts', '🎁', 'EXPENSE'),
    ('Travel', '✈️', 'EXPENSE'),
    ('Fuel', '⛽', 'EXPENSE'),
    ('Maintenance', '🔧', 'EXPENSE'),
    ('Pets', '🐾', 'EXPENSE'),
    ('Kids', '🧸', 'EXPENSE'),
    ('Salary', '💵', 'INCOME'),
    ('Business', '💼', 'INCOME'),
    ('Interest', '🏦', 'INCOME')
) AS c(name, icon, type)
WHERE NOT EXISTS (SELECT 1 FROM public.categories cat WHERE cat.user_id = p.id);

-- Backfill user_settings for users missing settings
INSERT INTO public.user_settings (user_id)
SELECT p.id
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_settings s WHERE s.user_id = p.id);
