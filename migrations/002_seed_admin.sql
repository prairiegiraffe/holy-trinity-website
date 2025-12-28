-- Seed initial admin user
-- IMPORTANT: After running this, you MUST use the accept-invite flow to set the password
-- Run with: wrangler d1 execute holy-trinity-cms --file=./migrations/002_seed_admin.sql

-- Generate a placeholder invite token (you'll replace this with a real one from the app)
-- In practice, you should create the first admin via a script or manually

-- Option 1: Insert with a known invite token for first-time setup
-- Replace 'your-email@example.com' and 'Your Name' with actual values
INSERT INTO users (email, name, role, invite_token, invite_expires_at, is_active)
VALUES (
  'admin@holytrinitygillette.org',
  'Admin User',
  'admin',
  'initial-setup-token-replace-me',
  datetime('now', '+48 hours'),
  0
);

-- After running this migration:
-- 1. Go to /admin/accept-invite?token=initial-setup-token-replace-me
-- 2. Set your password
-- 3. You're now logged in as admin and can invite other users
