# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### General
- Install all dependencies: `npm run install:all`
- Run both client and server (dev mode): `npm run dev`

### Backend (server)
- Run server (dev): `cd server && npm run dev`
- Run server (start): `cd server && npm run start`
- Run tests: `cd server && npx jest` (or `npm test` if configured)

### Frontend (client)
- Run client (dev): `cd client && npm run dev`
- Build client: `cd client && npm run build`

## Architecture & Structure

### High-Level Design
The project follows a Client-Server architecture with a layered backend design (Controller-Service-Model).

### Backend (Node.js, Express, MongoDB)
- **Entry Point**: `server/src/index.js` $\rightarrow$ `server/src/app.js`
- **Routing**: `server/src/routes/` (resource-based: auth, reviews, users)
- **Business Logic**: `server/src/controllers/`
- **Data Layer**: `server/src/models/` (Mongoose schemas)
- **Authentication**: `server/src/middleware/auth.js` implements JWT verification.
- **Database**: Configured in `server/src/config/db.js`.

### Frontend (React, Vite, Tailwind CSS)
- **API Layer**: `client/src/api.js` (Axios instance with automatic JWT injection).
- **Auth State**: `client/src/context/AuthContext.jsx` manages session and JWT tokens in `localStorage`.
- **Routing**: `react-router-dom` with `ProtectedRoute` components for authenticated routes.

## Key Constraints & Patterns
- **Authentication**: JWT-based. Mutation endpoints (POST/PATCH/DELETE) are protected by `requireAuth` middleware.
- **Review Logic**: The server derives the `reviewedBy` user ID from the JWT; requests containing `reviewedBy` in the body are rejected.
- **Env Vars**: Backend requires `.env` with `PORT`, `MONGO_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`.
