import { Router } from 'express';
import {
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
} from '../controllers/announcementController';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('saas_admin', 'management'), createAnnouncement);
router.put('/:id', authorize('saas_admin', 'management'), updateAnnouncement);
router.delete('/:id', authorize('saas_admin', 'management'), deleteAnnouncement);

export default router;
