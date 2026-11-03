import axios from 'axios';
const api = axios.create({ 
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use(c =>
 { const token = sessionStorage.getItem('farm2market_token'); 
if (token) c.headers.Authorization = `Bearer ${token}`; return c; });
export default api;
