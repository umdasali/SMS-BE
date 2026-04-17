import 'dotenv/config';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';

let isConnected = false;

const connectDB = async (): Promise<void> => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI as string);
  isConnected = true;
};

const seedSaasAdmin = async (): Promise<void> => {
  const email = process.env.SAAS_ADMIN_EMAIL;
  const password = process.env.SAAS_ADMIN_PASSWORD;
  const name = process.env.SAAS_ADMIN_NAME || 'SaaS Admin';
  if (!email || !password) return;
  const exists = await User.findOne({ email, role: 'saas_admin' });
  if (!exists) {
    await User.create({ name, email, password, role: 'saas_admin', isActive: true });
  }
};

// Vercel invokes this as a serverless function — connect on cold start
const handler = async (req: any, res: any) => {
  await connectDB();
  await seedSaasAdmin();
  return app(req, res);
};

export default handler;
