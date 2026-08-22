import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const groups = {
  Vegetables: 'Tomato, Onion, Potato, Carrot, Cabbage, Cauliflower, Brinjal, Lady\'s Finger, Other Vegetables',
  Fruits: 'Mango, Banana, Papaya, Guava, Watermelon, Orange, Other Fruits',
  Grains: 'Rice, Wheat, Maize, Millets, Other Grains',
  Pulses: 'Green Gram, Black Gram, Chickpeas, Other Pulses',
  'Farm Products': 'Coconut, Groundnut, Turmeric, Ginger, Honey, Other Farm Products'
};
for (const [name, description] of Object.entries(groups)) await prisma.category.upsert({ where: { name }, update: { description }, create: { name, description } });
await prisma.$disconnect();
