import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import { transcribeAndAct } from '../controllers/voice.controller.js';

const router = Router();

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(webm|wav|mp3|m4a|ogg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported audio format.'));
    }
  },
});

router.use(requireAuth);

router.post('/transcribe-and-act', audioUpload.single('audio'), transcribeAndAct);

export default router;
