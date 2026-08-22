import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const hasCloudinaryCredentials = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const serviceDirectory = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDirectory = path.resolve(serviceDirectory, '../../uploads');

if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadImage(file, publicBaseUrl) {
  if (!hasCloudinaryCredentials) {
    await mkdir(uploadsDirectory, { recursive: true });

    const originalExtension = path.extname(file.originalname).toLowerCase();
    const extension = /^\.(avif|gif|jpe?g|png|webp)$/.test(originalExtension)
      ? originalExtension
      : '.jpg';
    const filename = `${randomUUID()}${extension}`;

    await writeFile(path.join(uploadsDirectory, filename), file.buffer);

    return `${publicBaseUrl.replace(/\/$/, '')}/uploads/${filename}`;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'farm2market/products' }, (error, result) => error ? reject(error) : resolve(result.secure_url));
    Readable.from(file.buffer).pipe(stream);
  });
}
