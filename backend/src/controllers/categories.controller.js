import { prisma } from '../config/prisma.js';
export async function listCategories(_, res) { res.json({ categories: await prisma.category.findMany({ orderBy: { name: 'asc' } }) }); }
export async function addCategory(req, res) { const category = await prisma.category.create({ data: { name: req.body.name, description: req.body.description || null } }); res.status(201).json({ category }); }
