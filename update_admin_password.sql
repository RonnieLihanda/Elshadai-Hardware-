-- Update admin user password to: admin123
-- This is a fresh bcrypt hash we just generated
UPDATE users
SET password_hash = '$2b$10$DyYDH1MbsGFH3T6UFVNZJukpcWR25deNufX3SjAX2lxP.WMDb60Fe'
WHERE username = 'admin';

-- Verify the update
SELECT id, username, full_name, role, is_active,
       LEFT(password_hash, 20) as password_hash_preview
FROM users
WHERE username = 'admin';
