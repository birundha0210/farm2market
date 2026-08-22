import { prisma } from '../config/prisma.js';
export async function listNotifications(req, res) { res.json({ notifications: await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }) }); }
export async function readNotification(req, res) { const n = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user.id } }); if (!n) return res.status(404).json({ message: 'Notification not found.' }); res.json({ notification: await prisma.notification.update({ where: { id: n.id }, data: { isRead: true } }) }); }
export async function readAll(req, res) { await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } }); res.status(204).end(); }
