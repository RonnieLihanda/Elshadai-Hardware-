-- Check existing users
SELECT
    id,
    username,
    full_name,
    role,
    is_active,
    created_at
FROM users
ORDER BY created_at DESC;

-- If no users exist, create an admin user
-- Password: admin123 (change this after first login!)
INSERT INTO users (username, password_hash, full_name, role, is_active)
VALUES (
    'admin',
    '$2a$10$rKZVKq8tF3xK6Q8n5YqYxOxN5Z8VXyD5eJWYQvH1eL3pHhLjMYfNe', -- bcrypt hash of 'admin123'
    'System Administrator',
    'admin',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Verify the user was created
SELECT
    id,
    username,
    full_name,
    role,
    is_active,
    created_at
FROM users
WHERE username = 'admin';
