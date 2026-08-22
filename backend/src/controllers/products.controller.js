import { validationResult } from 'express-validator';
import { prisma } from '../config/prisma.js';
import { uploadImage } from '../services/storage.js';
import { productInclude } from '../utils/serializers.js';

export async function listProducts(req, res) {
  const { category, search, minPrice, maxPrice, minQuantity, location, mine } = req.query;
  const where = { ...(mine === 'true' ? { farmerId: req.user.id } : { status: 'ACTIVE', quantityKg: { gt: 0 } }), ...(category ? { categoryId: category } : {}), ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}), ...(minPrice || maxPrice ? { pricePerKg: { ...(minPrice ? { gte: Number(minPrice) } : {}), ...(maxPrice ? { lte: Number(maxPrice) } : {}) } } : {}), ...(minQuantity ? { quantityKg: { gte: Math.max(1, Number(minQuantity)) } } : {}), ...(location ? { farmer: { farmerProfile: { landDetails: { contains: location, mode: 'insensitive' } } } } : {}) };
  res.json({ products: await prisma.product.findMany({ where, include: productInclude, orderBy: { createdAt: 'desc' } }) });
}
export async function getProduct(req, res) { const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: productInclude }); if (!product) return res.status(404).json({ message: 'Product not found.' }); res.json({ product }); }
export async function createProduct(req, res) {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(422).json({ message: 'Please correct the product details.', errors: errors.array() });
  const imageUrl = req.file ? await uploadImage(req.file, `${req.protocol}://${req.get('host')}`) : null;
  const product = await prisma.product.create({ data: { farmerId: req.user.id, categoryId: req.body.categoryId, name: req.body.name, quantityKg: Number(req.body.quantityKg), pricePerKg: Number(req.body.pricePerKg), description: req.body.description || null, imageUrl }, include: productInclude });
  res.status(201).json({ product });
}
export async function updateProduct(req, res) {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ message: 'Product not found.' }); if (product.farmerId !== req.user.id) return res.status(403).json({ message: 'You can only edit your own products.' });
  const data = {}; ['name', 'description', 'categoryId'].forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  if (req.body.pricePerKg !== undefined && Number(req.body.pricePerKg) > 0) data.pricePerKg = Number(req.body.pricePerKg);
  if (req.file) data.imageUrl = await uploadImage(req.file, `${req.protocol}://${req.get('host')}`);
  const updated = await prisma.product.update({ where: { id: product.id }, data, include: productInclude }); res.json({ product: updated });
}
export async function removeProduct(req, res) { const product = await prisma.product.findUnique({ where: { id: req.params.id } }); if (!product) return res.status(404).json({ message: 'Product not found.' }); if (product.farmerId !== req.user.id) return res.status(403).json({ message: 'You can only manage your own products.' }); await prisma.product.update({ where: { id: product.id }, data: { status: 'INACTIVE' } }); res.status(204).end(); }
