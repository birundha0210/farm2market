import { Router } from 'express'; import { authenticate } from '../middleware/auth.js'; import { listNotifications, readAll, readNotification } from '../controllers/notifications.controller.js';
const router = Router(); router.use(authenticate); router.get('/', listNotifications); router.put('/read-all', readAll); router.put('/:id/read', readNotification); export default router;
