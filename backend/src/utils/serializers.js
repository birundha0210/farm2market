export const publicUser = (user) => ({
  id: user.id, name: user.name, email: user.email, username: user.username, loginCode: user.loginCode,
  dob: user.dob, gender: user.gender, role: user.role, farmerProfile: user.farmerProfile, buyerProfile: user.buyerProfile,
  products: user.products, createdAt: user.createdAt
});
export const productInclude = { category: true, farmer: { select: { id: true, name: true, username: true, farmerProfile: true } } };
export const orderInclude = { product: { include: { category: true } }, buyer: { select: { id: true, name: true, email: true, buyerProfile: true } }, farmer: { select: { id: true, name: true, email: true, farmerProfile: true } } };
