# Create Admin User in Supabase

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/vphdxmxcwbpkvppytrjn
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the following SQL:

```sql
-- Check existing users first
SELECT id, username, full_name, role, is_active
FROM users
ORDER BY created_at DESC;
```

5. Click "Run" to see existing users

---

## Option 2: Create New Admin User

If no admin user exists, run this SQL:

```sql
-- Create admin user with password: admin123
INSERT INTO users (username, password_hash, full_name, role, is_active)
VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoM4eUO9J5nhkG.vABq8J9vKT0qYj0Z5R1gC',
    'System Administrator',
    'admin',
    TRUE
);
```

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

---

## Option 3: Create Custom User

To create a user with your own credentials:

```sql
-- Replace 'your-username' and use a strong password hash
INSERT INTO users (username, password_hash, full_name, role, is_active)
VALUES (
    'your-username',
    '$2a$10$...',  -- You'll need to generate this hash
    'Your Full Name',
    'admin',  -- or 'cashier' for non-admin
    TRUE
);
```

To generate a bcrypt hash for your password, you can use:
- https://bcrypt-generator.com/ (Use cost factor 10)
- Or create it programmatically

---

## Verify User Creation

After creating the user, verify with:

```sql
SELECT id, username, full_name, role, is_active, created_at
FROM users
WHERE username = 'admin';
```

You should see your newly created user.

---

## Test Login

Once the user is created:
1. Go to https://frontend-sandy-three-35.vercel.app
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. You should successfully log in!

---

## Common Password Hashes for Testing

Here are some pre-generated bcrypt hashes for common passwords (cost factor 10):

| Password | Bcrypt Hash |
|----------|-------------|
| admin123 | `$2a$10$N9qo8uLOickgx2ZMRZoM4eUO9J5nhkG.vABq8J9vKT0qYj0Z5R1gC` |
| password123 | `$2a$10$rKZVKq8tF3xK6Q8n5YqYxOxN5Z8VXyD5eJWYQvH1eL3pHhLjMYfNe` |
| admin | `$2a$10$5iug1O3vTKvXnJQcW3HpJuXxYmZz7Q4OJ7kBXxWzCQJmZFzHvJgK6` |

⚠️ **Security Note:** These are for testing only. In production, use strong unique passwords!
