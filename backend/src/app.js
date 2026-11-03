import 'dotenv/config';
import express from 'express'; 
import cors from 'cors';
import auth from './routes/auth.routes.js'; 
import products from './routes/products.routes.js'; 
import categories from './routes/categories.routes.js'; 
import orders from './routes/orders.routes.js';
 import notifications from './routes/notifications.routes.js'; 
 import profiles from './routes/profiles.routes.js';
import { uploadsDirectory } from './services/storage.js';
const app = express(); app.use(cors({
 origin: process.env.CLIENT_URL || 'http://localhost:5173' })); 
app.use(express.json()); app.use('/uploads', express.static(uploadsDirectory));
app.get('/api/health', (_, res) => res.json({ ok: true })); app.use('/api/auth', auth); 
app.use('/api/products', products); 
app.use('/api/categories', categories);
app.use('/api/orders', orders);
app.use('/api/notifications', notifications);
app.use('/api/profiles', profiles);
// Role-named profile endpoints keep the public API intuitive while sharing the same ownership protection.
app.use('/api/farmers', profiles); app.use('/api/buyers', profiles);
app.use((err, _, res, __) => { 
console.error(err);
res.status(err.status || 500).json({
message: err.message || 'An unexpected server error occurred.' }); });
export default app;
