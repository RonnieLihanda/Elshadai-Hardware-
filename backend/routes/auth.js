const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
    }

    try {
        const { rows } = await db.query(`SELECT * FROM users WHERE username = $1 AND is_active = TRUE`, [username]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
            process.env.JWT_SECRET || 'elshadai_secret_key_2026',
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.full_name
            }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/me', authenticateToken, (req, res) => {
    res.json(req.user);
});

module.exports = router;
