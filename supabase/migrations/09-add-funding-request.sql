
-- Add 'fund_request' to the action enum in the proposals table
-- Note: Supabase does not directly support altering enums in migrations.
-- This will be a manual step in the Supabase dashboard or a more complex migration script.

-- Add amount column to proposals table
alter table proposals add column amount integer;
