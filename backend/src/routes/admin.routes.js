import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../controllers/companies.controller.js';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  adminResetPassword,
} from '../controllers/users.controller.js';

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// Company management — super_admin only
router.get('/companies', requireRole(['super_admin']), listCompanies);
router.post('/companies', requireRole(['super_admin']), createCompany);
router.put('/companies/:id', requireRole(['super_admin']), updateCompany);
router.delete('/companies/:id', requireRole(['super_admin']), deleteCompany);

// User management — company_admin or super_admin
router.get('/users', requireRole(['company_admin', 'super_admin']), listUsers);
router.post('/users', requireRole(['company_admin', 'super_admin']), createUser);
router.put('/users/:id', requireRole(['company_admin', 'super_admin']), updateUser);
router.delete('/users/:id', requireRole(['company_admin', 'super_admin']), deleteUser);
router.post('/users/:id/reset-password', requireRole(['company_admin', 'super_admin']), adminResetPassword);

export default router;
