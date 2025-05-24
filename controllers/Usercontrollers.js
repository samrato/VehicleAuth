const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // your PostgreSQL pool

// Helper to generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, password2 } = req.body;

    if (!name || !email || !password || !password2) {
      return res.status(422).json({ error: 'Please fill in all fields' });
    }

    const newEmail = email.toLowerCase();

    // Check if email exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [newEmail]);
    if (emailCheck.rows.length > 0) {
      return res.status(422).json({ error: 'Email already exists' });
    }

    if (password.trim().length < 6) {
      return res.status(422).json({ error: 'Password should be at least 6 characters' });
    }

    if (password !== password2) {
      return res.status(422).json({ error: 'Passwords do not match' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Assign admin if email matches specific address
    const isAdmin = newEmail === 'onyangojuma984@gmail.com';

    // Insert user
    const insertQuery = `
      INSERT INTO users (name, email, password, isAdmin)
      VALUES ($1, $2, $3, $4) RETURNING id
    `;
    const result = await pool.query(insertQuery, [name, newEmail, hashedPassword, isAdmin]);

    res.status(201).json({ message: `User ${name} registered successfully`, userId: result.rows[0].id });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ error: 'Please fill in all fields' });
    }

    const newEmail = email.toLowerCase();

    const query = 'SELECT id, password, isAdmin FROM users WHERE email = $1';
    const result = await pool.query(query, [newEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, isAdmin: user.isAdmin });

    res.json({
      token,
      id: user.id,
      isAdmin: user.isAdmin,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

module.exports = { registerUser, loginUser };
