# SMS Backend

A Node.js + TypeScript backend API for a School Management System. This project provides tenant-aware onboarding, authentication, student/teacher management, attendance, exams, finance, certificates, routines, announcements, assets, and dashboard endpoints.

## Tech Stack

- Node.js
- TypeScript
- Express
- MongoDB / Mongoose
- JWT authentication
- Cloudinary for media uploads
- Nodemailer for email delivery
- Helmet, CORS, cookie-parser, Morgan

## Project Structure

- `src/app.ts` - Express app configuration, middleware, and route wiring
- `src/server.ts` - App bootstrap, database connection, and SaaS admin seeding
- `src/config/db.ts` - MongoDB connection logic
- `src/controllers/` - Request handlers for each domain
- `src/routes/` - Route definitions grouped by resource
- `src/models/` - Mongoose schemas and models
- `src/middleware/` - Authentication and error handling middleware
- `src/utils/` - Shared helpers for JWT, mailing, responses, and cloudinary

## Key Features

- Tenant onboarding and management
- User authentication and authorization
- Student and teacher management
- Class, subject, routine, attendance, and exam management
- Finance endpoints for fee slips and payslips
- Certificates and announcements management
- Asset tracking and assignment
- Profile and dashboard APIs
- Public routes for unauthenticated consumers

## Getting Started

### Prerequisites

- Node.js 18+ or compatible
- npm
- MongoDB connection URI

### Installation

1. Clone the repository

```bash
git clone <repo-url>
cd SMS-BE
npm install
```

2. Create a `.env` file in the project root with the required variables.

Example `.env`:

```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>

JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRES=3d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES=7d

CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

SAAS_ADMIN_EMAIL=admin@example.com
SAAS_ADMIN_NAME=SaaS Administrator
SAAS_ADMIN_PASSWORD=StrongPassword123!
```

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
npm start
```

## API Base URL

- `http://localhost:<PORT>/api/v1`

## Health Check

- `GET /health`

## Important Notes

- The backend auto-seeds a tenant SaaS administrator account on startup when `SAAS_ADMIN_EMAIL`, `SAAS_ADMIN_PASSWORD`, and `SAAS_ADMIN_NAME` are provided.
- `src/app.ts` allows CORS for origins configured via `CORS_ORIGINS` or `FRONTEND_URL`, plus local dev origins in non-production mode.
- Error handling is centralized in `src/middleware/errorHandler.ts`.

## Available Scripts

- `npm run dev` — Start the server in development with `ts-node` and `nodemon`
- `npm run build` — Compile TypeScript to `dist/`
- `npm start` — Run the compiled production server

## License

This project uses the ISC license. Update `package.json` if you want to change the license.
