const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateResetToken, sendResetEmail } = require('../utils/authservice');


const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' }); // short-lived token
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }); // long-lived token
};


// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password, password2 } = req.body;
    if (!name || !email || !password || !password2) {
      return res.status(422).json({ error: 'Please fill in all fields' });
    }

    const newEmail = email.toLowerCase();

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const isadmin = newEmail === 'onyangojuma984@gmail.com';

    const result = await pool.query(
      `INSERT INTO users (name, email, password, isadmin)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, newEmail, hashedPassword, isadmin]
    );

    res.status(201).json({ message: `User ${name} registered`, userId: result.rows[0].id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ error: 'Please fill in all fields' });
    }

    const newEmail = email.toLowerCase();
    const query = 'SELECT id, name, email, password, isAdmin FROM users WHERE email = $1';
    const result = await pool.query(query, [newEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { id: user.id, isadmin: user.isadmin };  // lowercase if your DB field is "isadmin"
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isadmin: user.isadmin,  // lowercase if your column is lowercase
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};


// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const user = userCheck.rows[0];
    const token = generateResetToken(user);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );

    await sendResetEmail(email, token);
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', details: err.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = userQuery.rows[0];

    if (!user || user.reset_token !== token || new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', details: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};
