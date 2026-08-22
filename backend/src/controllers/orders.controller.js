import { prisma } from '../config/prisma.js';
import { emailLayout, sendEmail } from '../services/email.js';
import { orderInclude } from '../utils/serializers.js';
const notify = (userId, type, title, message) => prisma.notification.create({ data: { userId, type, title, message } });
const detail = order => `${order.product.name} · ${order.requestedQuantityKg} kg · ₹${order.totalAmount}`;

const locationFromBody = (body, { required = false } = {}) => {
  const latitudeProvided = body.latitude !== undefined && body.latitude !== null;
  const longitudeProvided = body.longitude !== undefined && body.longitude !== null;
  if (!latitudeProvided && !longitudeProvided) {
    if (required) throw Object.assign(new Error('A valid location is required.'), { status: 422 });
    return null;
  }
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  if (!latitudeProvided || !longitudeProvided || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw Object.assign(new Error('Please share a valid location.'), { status: 422 });
  }
  return { latitude, longitude };
};

export async function createOrder(req, res) {
  const { productId, quantityKg } = req.body; const quantity = Number(quantityKg);
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(422).json({ message: 'Enter a valid purchase quantity.' });
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { farmer: true } });
  if (!product || product.status !== 'ACTIVE') return res.status(404).json({ message: 'This product is no longer available.' });
  if (quantity > product.quantityKg) return res.status(422).json({ message: `Only ${product.quantityKg} kg is currently available.` });
  const total = Number(product.pricePerKg) * quantity;
  const order = await prisma.order.create({ data: { buyerId: req.user.id, farmerId: product.farmerId, productId, requestedQuantityKg: quantity, agreedPricePerKg: product.pricePerKg, totalAmount: total }, include: orderInclude });
  await notify(product.farmerId, 'NEW_ORDER', 'New order received', `${req.user.name} requested ${detail(order)}.`);
  sendEmail({ to: product.farmer.email, subject: 'New Order Received', html: emailLayout('New order received', `<p>${req.user.name} has requested ${detail(order)}.</p>`) });
  res.status(201).json({ order });
}
export async function listOrders(req, res) { const where = req.user.role === 'FARMER' ? { farmerId: req.user.id } : { buyerId: req.user.id }; res.json({ orders: await prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' } }) }); }
export async function farmerAccept(req, res) {
  const location = locationFromBody(req.body);
  const saved = await prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw Object.assign(new Error('Order not found.'), { status: 404 });
    if (order.farmerId !== req.user.id || order.status !== 'PENDING' || order.farmerAccepted) throw Object.assign(new Error('This order cannot be accepted.'), { status: 409 });
    if (!Number.isInteger(order.requestedQuantityKg) || order.requestedQuantityKg < 1) throw Object.assign(new Error('Order has an invalid requested quantity.'), { status: 422 });

    const product = await tx.product.findUnique({ where: { id: order.productId } });
    if (!product || product.farmerId !== req.user.id) throw Object.assign(new Error('You can only accept orders for your own products.'), { status: 403 });
    if (product.status !== 'ACTIVE') throw Object.assign(new Error('This product is no longer available.'), { status: 422 });
    if (product.quantityKg < order.requestedQuantityKg) throw Object.assign(new Error(`Insufficient quantity. Only ${product.quantityKg} kg remains.`), { status: 422 });

    const accepted = await tx.order.updateMany({
      where: { id: order.id, farmerId: req.user.id, status: 'PENDING', farmerAccepted: false },
      data: { farmerAccepted: true, status: 'FARMER_ACCEPTED', ...(location ? { farmerLatitude: location.latitude, farmerLongitude: location.longitude } : {}) }
    });
    if (!accepted.count) throw Object.assign(new Error('This order cannot be accepted.'), { status: 409 });

    const reduced = await tx.product.updateMany({
      where: { id: product.id, farmerId: req.user.id, status: 'ACTIVE', quantityKg: { gte: order.requestedQuantityKg } },
      data: { quantityKg: { decrement: order.requestedQuantityKg } }
    });
    if (!reduced.count) {
      const currentProduct = await tx.product.findUnique({ where: { id: product.id }, select: { quantityKg: true } });
      throw Object.assign(new Error(`Insufficient quantity. Only ${currentProduct?.quantityKg ?? 0} kg remains.`), { status: 422 });
    }

    const updatedProduct = await tx.product.findUnique({ where: { id: product.id } });
    if (updatedProduct.quantityKg === 0) await tx.product.update({ where: { id: product.id }, data: { status: 'SOLD_OUT' } });
    return tx.order.findUnique({ where: { id: order.id }, include: orderInclude });
  });
  await notify(saved.buyerId, 'FARMER_ACCEPTED', 'Farmer accepted your order', `Your deal is ready for review: ${detail(saved)}.`);
  sendEmail({ to: saved.buyer.email, subject: 'Farmer Accepted Your Order', html: emailLayout('Your deal is ready', `<p>${saved.farmer.name} accepted ${detail(saved)}. Review and confirm the deal in Farm2Market.</p>`) });
  res.json({ order: saved });
}

export async function shareFarmerLocation(req, res) {
  const location = locationFromBody(req.body, { required: true });
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.farmerId !== req.user.id) return res.status(403).json({ message: 'You can only share a location for your own order.' });
  const saved = await prisma.order.update({ where: { id: order.id }, data: { farmerLatitude: location.latitude, farmerLongitude: location.longitude }, include: orderInclude });
  res.json({ order: saved });
}
export async function shareBuyerLocation(req, res) {
  const location = locationFromBody(req.body, { required: true });
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.buyerId !== req.user.id) return res.status(403).json({ message: 'You can only share a location for your own order.' });
  if (!['FARMER_ACCEPTED', 'CONFIRMED'].includes(order.status)) return res.status(409).json({ message: 'Buyer location sharing is only available for an accepted or confirmed deal.' });
  const saved = await prisma.order.update({ where: { id: order.id }, data: { buyerLatitude: location.latitude, buyerLongitude: location.longitude }, include: orderInclude });
  res.json({ order: saved });
}
export async function farmerReject(req, res) { const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: orderInclude }); if (!order) return res.status(404).json({ message: 'Order not found.' }); if (order.farmerId !== req.user.id || order.status !== 'PENDING') return res.status(409).json({ message: 'This order cannot be rejected.' }); const saved = await prisma.order.update({ where: { id: order.id }, data: { status: 'REJECTED' }, include: orderInclude }); await notify(order.buyerId, 'ORDER_REJECTED', 'Order rejected', `${order.farmer.name} was unable to accept ${detail(saved)}.`); sendEmail({ to: order.buyer.email, subject: 'Order Rejected', html: emailLayout('Order update', `<p>${order.farmer.name} was unable to accept this order.</p>`) }); res.json({ order: saved }); }
export async function buyerAccept(req, res) {
  const result = await prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: req.params.id }, include: orderInclude });
    if (!order) throw Object.assign(new Error('Order not found.'), { status: 404 });
    if (order.buyerId !== req.user.id || order.status !== 'FARMER_ACCEPTED') throw Object.assign(new Error('This deal cannot be confirmed.'), { status: 409 });
    return tx.order.update({ where: { id: order.id }, data: { buyerAccepted: true, status: 'CONFIRMED' }, include: orderInclude });
  }).catch(e => { throw e; });
  await notify(result.farmerId, 'ORDER_CONFIRMED', 'Buyer confirmed the deal', `${result.buyer.name} confirmed ${detail(result)}.`); await notify(result.buyerId, 'ORDER_CONFIRMED', 'Order confirmed', `Your order for ${detail(result)} is confirmed.`);
  sendEmail({ to: result.farmer.email, subject: 'Buyer Confirmed the Deal', html: emailLayout('Deal confirmed', `<p>${result.buyer.name} confirmed ${detail(result)}.</p>`) }); sendEmail({ to: result.buyer.email, subject: 'Product Order Confirmed', html: emailLayout('Order confirmed', `<p>Your order for ${detail(result)} is confirmed.</p>`) }); res.json({ order: result });
}
export async function buyerReject(req, res) {
  const saved = await prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: req.params.id }, include: orderInclude });
    if (!order) throw Object.assign(new Error('Order not found.'), { status: 404 });
    if (order.buyerId !== req.user.id || order.status !== 'FARMER_ACCEPTED') throw Object.assign(new Error('This deal cannot be cancelled.'), { status: 409 });

    const product = await tx.product.findUnique({ where: { id: order.productId } });
    if (!product) throw Object.assign(new Error('Product not found.'), { status: 404 });

    const rejected = await tx.order.updateMany({
      where: { id: order.id, buyerId: req.user.id, status: 'FARMER_ACCEPTED' },
      data: { status: 'BUYER_REJECTED' }
    });
    if (!rejected.count) throw Object.assign(new Error('This deal cannot be cancelled.'), { status: 409 });

    await tx.product.update({
      where: { id: product.id },
      data: {
        quantityKg: { increment: order.requestedQuantityKg },
        ...(product.status === 'SOLD_OUT' ? { status: 'ACTIVE' } : {})
      }
    });

    return tx.order.findUnique({ where: { id: order.id }, include: orderInclude });
  });
  await notify(saved.farmerId, 'DEAL_CANCELLED', 'Buyer declined the deal', `${saved.buyer.name} declined ${detail(saved)}.`);
  res.json({ order: saved });
}
