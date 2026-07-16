import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, withCompanyContext } from '../db/pool.js';
import { sendPasswordResetEmail } from '../utils/email.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// In-memory reset token store (use Redis in production for multi-instance support)
const resetTokens = new Map(); // token -> { userId, companyId, expiresAt }

/**
 * POST /api/auth/login
 * Body: { dealer_code, email, password }
 */
export async function login(req, res) {
  try {
    const { dealer_code, email, password } = req.body;

    if (!dealer_code || !email || !password) {
      return res.status(400).json({ error: 'dealer_code, email, and password are required.' });
    }

    // Look up the company by dealer code
    const companyResult = await query(
      'SELECT id, name, logo_url FROM companies WHERE dealer_code = $1',
      [dealer_code.trim().toUpperCase()]
    );

    if (companyResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const company = companyResult.rows[0];

    // Look up user within that company (bypass RLS for auth lookup)
    const userResult = await query(
      'SELECT id, company_id, role, email, password_hash, name FROM users WHERE email = $1 AND company_id = $2',
      [email.trim().toLowerCase(), company.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        companyId: user.company_id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      company: {
        id: company.id,
        name: company.name,
        logo_url: company.logo_url,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/logout
 * Stateless JWT — client discards token. Endpoint provided for convention.
 */
export async function logout(req, res) {
  return res.json({ message: 'Logged out successfully.' });
}

/**
 * POST /api/auth/reset-password-request
 * Body: { dealer_code, email }
 */
export async function resetPasswordRequest(req, res) {
  try {
    const { dealer_code, email } = req.body;

    if (!dealer_code || !email) {
      return res.status(400).json({ error: 'dealer_code and email are required.' });
    }

    const companyResult = await query(
      'SELECT id, name FROM companies WHERE dealer_code = $1',
      [dealer_code.trim().toUpperCase()]
    );

    if (companyResult.rows.length === 0) {
      // Return success even if not found to prevent enumeration
      return res.json({ message: 'If that account exists, a reset email has been sent.' });
    }

    const company = companyResult.rows[0];

    const userResult = await query(
      'SELECT id FROM users WHERE email = $1 AND company_id = $2',
      [email.trim().toLowerCase(), company.id]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

      resetTokens.set(token, { userId: user.id, companyId: company.id, expiresAt });

      await sendPasswordResetEmail(email, token, company.name);
    }

    return res.json({ message: 'If that account exists, a reset email has been sent.' });
  } catch (err) {
    console.error('Reset password request error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { token, new_password }
 */
export async function resetPassword(req, res) {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ error: 'token and new_password are required.' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const record = resetTokens.get(token);

    if (!record || record.expiresAt < Date.now()) {
      resetTokens.delete(token);
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const hash = await bcrypt.hash(new_password, 12);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hash, record.userId]
    );

    resetTokens.delete(token);

    return res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
