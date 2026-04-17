import { Router } from 'express';
import { register, checkSchoolCode } from '../controllers/onboardingController';
import { upload } from '../utils/cloudinary';

const router = Router();

router.get('/check-code/:code', checkSchoolCode);
router.post('/register', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), register);

export default router;
