import 'dotenv/config';
import app from './app';
import connectDB from './config/db';
import User from './models/User';

const PORT = process.env.PORT || 5000;

const seedSaasAdmin = async (): Promise<void> => {
  const email = process.env.SAAS_ADMIN_EMAIL;
  const password = process.env.SAAS_ADMIN_PASSWORD;
  const name = process.env.SAAS_ADMIN_NAME || 'SaaS Admin';

  if (!email || !password) return;

  const exists = await User.findOne({ email, role: 'saas_admin' });
  if (!exists) {
    const username = email.split('@')[0];
    await User.create({ name, email, username, password, role: 'saas_admin', isActive: true });
    console.log(`✅ SaaS Admin seeded: ${email}`);
  }
};

const start = async (): Promise<void> => {
  await connectDB();
  await seedSaasAdmin();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API base: http://localhost:${PORT}/api/v1`);
  });
};

start().catch(console.error);
