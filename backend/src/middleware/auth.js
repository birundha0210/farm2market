import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
    req.user = user;
    next();
  } catch { return res.status(401).json({ message: 'Your session is invalid or has expired.' }); }
}
export const allowRoles = (...roles) => (req, res, next) => roles.includes(req.user.role)
  ? next() : res.status(403).json({ message: 'You do not have access to this resource.' });
