import { Router } from 'express'; import { authenticate } from '../middleware/auth.js'; import { getProfile, updateProfile } from '../controllers/profiles.controller.js';
const router = Router(); router.use(authenticate); router.get('/:id', getProfile); router.put('/:id', updateProfile); export default router;
