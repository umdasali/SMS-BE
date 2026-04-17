import { Router } from 'express';
import { getRoutine, upsertRoutine } from '../controllers/routineController';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/', getRoutine);
router.post('/', authorize('saas_admin', 'management'), upsertRoutine);

export default router;
