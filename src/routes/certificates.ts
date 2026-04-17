import { Router } from 'express';
import {
  getCertificates, generateCertificate, getStudentCertificates, getCertificate,
  revokeCertificate, getMyCertificates, deleteCertificate,
} from '../controllers/certificateController';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/my', authorize('student'), getMyCertificates);
router.get('/', authorize('saas_admin', 'management'), getCertificates);
router.post('/', authorize('saas_admin', 'management'), generateCertificate);
router.get('/student/:id', authorize('saas_admin', 'management', 'teacher'), getStudentCertificates);
router.get('/:id', getCertificate);
router.put('/:id/revoke', authorize('saas_admin', 'management'), revokeCertificate);
router.delete('/:id', authorize('saas_admin', 'management'), deleteCertificate);

export default router;
