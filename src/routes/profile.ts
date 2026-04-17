import { Router } from 'express';
import { protect } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import { getMyProfile, updateMyProfile, changeMyPassword } from '../controllers/profileController';

const router = Router();

router.use(protect);

router.get('/me', getMyProfile);
router.put('/me', upload.single('avatar'), updateMyProfile);
router.put('/me/password', changeMyPassword);

export default router;
