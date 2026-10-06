# Technical Documentation: Course Review Board

This document provides a technical overview of the Course Review Board application, including its architecture, data models, authentication flow, and API structure.

## Architecture Overview

The application follows a classic **MERN-like** (MongoDB, Express, React, Node.js) decoupled architecture:

- **Backend**: A Node.js/Express REST API that handles business logic, authentication, and database interactions.
- **Frontend**: A React single-page application (SPA) built with Vite and styled with Tailwind CSS.
- **Database**: MongoDB (Atlas), used for storing user and review data.

---

## Backend Technicalities

### 1. Technology Stack
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) and `bcryptjs` for password hashing
- **Validation**: `Joi` for schema-based request validation

### 2. Data Models

#### `User` Model
- `name`: String (Required)
- `email`: String (Required, Unique, Lowercase)
- `password`: String (Required, stored as a bcrypt hash)
- `timestamps`: Enabled (`createdAt`, `updatedAt`)
- **Methods**: `comparePassword(password)` used to verify login credentials.

#### `Review` Model
- `courseCode`: String (Required, Uppercase, Trimmed)
- `rating`: Number (Required, Range 1-5)
- `comment`: String (Optional)
- `reviewedBy`: ObjectId (Reference to `User`)
- **Constraints**: A unique compound index on `{ courseCode, reviewedBy }` ensures a user can only review a specific course once.

### 3. Authentication & Authorization Flow

#### JWT Implementation
- The server uses a secret key (`JWT_SECRET`) to sign tokens.
- Tokens contain the user's `id` and `name` in the payload.
- Tokens are sent to the client upon successful login or registration.

#### Middleware (`requireAuth`)
- A custom middleware intercepts requests to protected routes.
- It extracts the token from the `Authorization: Bearer <token>` header.
- It verifies the token using `jwt.verify()`.
- If valid, it attaches the decoded user payload to `req.user`.

#### Access Control
- **Public Access**: Viewing all reviews (`GET /api/reviews`) and course summaries (`GET /api/reviews/summary`).
- **Private Access**: Creating, updating, or deleting reviews, and managing user accounts.
- **Ownership**: Only the user who created a review (verified via `reviewedBy` matching `req.user.id`) is permitted to edit or delete it.

### 4. API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Creates a new user and returns a JWT. |
| `POST` | `/api/auth/login` | No | Validates credentials and returns a JWT. |
| `GET` | `/api/auth/me` | Yes | Returns current session user data. |
| `GET` | `/api/reviews` | No | Lists all reviews, populated with reviewer info. |
| `GET` | `/api/reviews/:id` | No | Gets a specific review by ID. |
| `GET` | `/api/reviews/summary` | No | Calculates avg rating and count for a course. |
| `POST` | `/api/reviews` | Yes | Creates a new review (user ID taken from token). |
| `PATCH` | `/api/reviews/:id` | Yes | Updates a review (ownership check required). |
| `DELETE` | `/api/reviews/:id` | Yes | Deletes a review (ownership check required). |

---

## Frontend Technicalities

### 1. Technology Stack
- **Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

### 2. State Management & Session

#### `AuthContext`
- Provides a global state for the current `user` and `loading` status.
- **Persistence**: The JWT is stored in `localStorage`.
- **Bootstrapping**: On initial load, the app calls `/api/auth/me` to restore the session if a token exists.

#### `api.js` Interceptor
- A centralized Axios instance is used for all API calls.
- A **request interceptor** automatically attaches the `Authorization: Bearer <token>` header to every outgoing request if a token is present in `localStorage`.

### 3. Routing & Protection
- The app uses React Router for navigation.
- **`ProtectedRoute`**: A wrapper component that checks the `AuthContext`. If the user is not logged in, it redirects them to the `/login` page, preventing unauthorized access to pages like the review form.

---

## Development Workflow

### Setup
1. Install all dependencies (client and server) using `npm run install:all`.
2. Configure `.env` in the `server/` directory with `PORT`, `MONGO_URI`, and `JWT_SECRET`.
3. Start the development servers with `npm run dev`.

### Key Constraints to Note
- **Case Insensitivity**: Course codes are converted to uppercase on the server to prevent duplicate entries for the same course (e.g., `cs101` vs `CS101`).
- **Input Validation**: Both the frontend and backend strictly validate ratings (1-5) and course codes.
