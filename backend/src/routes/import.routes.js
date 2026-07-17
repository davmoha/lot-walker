import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { previewImport, confirmImport } from '../controllers/import.controller.js';

const router = Router();

// Store file in memory (buffer) — no disk writes needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted.'));
    }
  },
});

router.use(requireAuth);
router.use(requireRole(['company_admin', 'super_admin']));

router.post('/preview', upload.single('file'), previewImport);
router.post('/confirm', upload.single('file'), confirmImport);

export default router;
