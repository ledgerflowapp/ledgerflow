-- Migration: 20260720_fix_unified_transactions_view.sql
-- Description: Fix missing business transactions in unified_contact_transactions view by removing mode filter on user's own transactions

CREATE OR REPLACE VIEW public.unified_contact_transactions AS
-- 1. My own transactions (No inversion needed) - removed mode restriction to include BUSINESS
SELECT 
    t.*, 
    t.contact_id AS local_contact_id, 
    t.flow AS local_flow
FROM public.transactions t
WHERE t.user_id = auth.uid()

UNION ALL

-- 2. Peer's transactions shared with me (Invert flow and map contact_id)
SELECT 
    t.*, 
    c_my.id AS local_contact_id, 
    (CASE WHEN t.flow = 'IN' THEN 'OUT' ELSE 'IN' END) AS local_flow
FROM public.transactions t
JOIN public.contacts c_peer ON t.contact_id = c_peer.id
JOIN public.contacts c_my ON c_my.linked_user_id = c_peer.user_id AND c_my.user_id = auth.uid()
WHERE t.user_id = c_peer.user_id 
  AND c_peer.linked_user_id = auth.uid() 
  AND t.mode = 'PERSONAL';
