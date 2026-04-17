import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: Express.Request, file: Express.Multer.File) => {
    let ext = file.mimetype.split('/')[1] || '';
    // Handle specific mimetypes
    if (ext.includes('svg')) ext = 'svg';
    if (ext === 'x-icon') ext = 'ico';

    let transformation: Record<string, unknown>[] = [{ width: 800, height: 800, crop: 'limit' }];
    
    // Cloudinary throws errors if transformations are applied to SVGs
    if (ext === 'svg') {
      transformation = [];
    }

    return {
      folder: 'sms',
      format: ext, // provide the explicitly coerced format
      transformation,
    };
  },
});

export const upload = multer({ storage });
export { cloudinary };
