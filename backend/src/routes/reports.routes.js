import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { getReportSummary, exportCSV } from '../controllers/reports.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['company_admin', 'super_admin']));

router.get('/summary', getReportSummary);
router.get('/export/csv', exportCSV);

export default router;
