import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { listDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departments.controller.js';
import { listTechnicians, createTechnician, updateTechnician, deleteTechnician } from '../controllers/technicians.controller.js';
import { listInventory, getVehicle, upsertVehicle, deleteVehicle, lookupVehicle } from '../controllers/inventory.controller.js';
import { listIssues, createIssue, closeIssue, deleteIssue } from '../controllers/issues.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Departments
router.get('/departments', listDepartments);
router.post('/departments', requireRole(['company_admin', 'super_admin']), createDepartment);
router.put('/departments/:id', requireRole(['company_admin', 'super_admin']), updateDepartment);
router.delete('/departments/:id', requireRole(['company_admin', 'super_admin']), deleteDepartment);

// Technicians
router.get('/technicians', listTechnicians);
router.post('/technicians', requireRole(['company_admin', 'super_admin']), createTechnician);
router.put('/technicians/:id', requireRole(['company_admin', 'super_admin']), updateTechnician);
router.delete('/technicians/:id', requireRole(['company_admin', 'super_admin']), deleteTechnician);

// Inventory
router.get('/inventory', listInventory);
router.get('/inventory/lookup', lookupVehicle);
router.get('/inventory/:id', getVehicle);
router.post('/inventory', requireRole(['company_admin', 'super_admin']), upsertVehicle);
router.delete('/inventory/:id', requireRole(['company_admin', 'super_admin']), deleteVehicle);

// Issues
router.get('/issues', listIssues);
router.post('/issues', createIssue);
router.post('/issues/:id/close', closeIssue);
router.delete('/issues/:id', requireRole(['company_admin', 'super_admin']), deleteIssue);

export default router;
