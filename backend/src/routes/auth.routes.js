import { Router } from 'express';
import {
  login,
  logout,
  resetPasswordRequest,
  resetPassword,
} from '../controllers/auth.controller.js';
import { query } from '../db/pool.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/reset-password-request', resetPasswordRequest);
router.post('/reset-password', resetPassword);

// Public endpoint: list companies for login dropdown (name + dealer_code only)
router.get('/companies', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, dealer_code FROM companies ORDER BY name ASC'
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
