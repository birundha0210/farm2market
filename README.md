# Farm2Market

Farm2Market is a direct B2B marketplace for farmers and business buyers, built with React/Vite, Express, PostgreSQL and Prisma.

## Local setup

1. Copy `.env.example` to `backend/.env`, then configure `DATABASE_URL` and `JWT_SECRET`. Cloudinary and SMTP values are optional but enable product image persistence and email delivery.
2. Install packages: `npm install`, `npm install --prefix backend`, and `npm install --prefix frontend`.
3. Create the database schema with `npm run db:migrate` and insert the category system with `npm run db:seed`.
4. Run both services with `npm run dev`.

The client is served at `http://localhost:5173`; the API defaults to port `5000`.

Login uses registered email plus the generated Farm2Market code. Registration passwords are bcrypt-hashed and never returned by the API.
