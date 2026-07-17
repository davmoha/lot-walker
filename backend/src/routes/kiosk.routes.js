import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  generateKioskToken,
  getKioskIssues,
  kioskCloseIssue,
  getKioskTechnicians,
} from '../controllers/kiosk.controller.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

/**
 * Middleware that accepts EITHER a standard user JWT OR a kiosk JWT.
 * Sets req.companyId and req.kioskDepartmentId as appropriate.
 */
function requireKioskOrAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type === 'kiosk') {
      req.companyId = decoded.company_id;
      req.kioskDepartmentId = decoded.department_id;
      req.user = { role: 'kiosk' };
    } else {
      // Standard user token
      req.companyId = decoded.company_id;
      req.user = decoded;
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Admin-only: generate a kiosk token for a department
router.post('/token', requireAuth, requireRole(['company_admin', 'super_admin']), generateKioskToken);

// Kiosk endpoints — accept kiosk or regular JWT
router.get('/issues', requireKioskOrAuth, getKioskIssues);
router.post('/issues/:id/close', requireKioskOrAuth, kioskCloseIssue);
router.get('/technicians', requireKioskOrAuth, getKioskTechnicians);

export default router;
