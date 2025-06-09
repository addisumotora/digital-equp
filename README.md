# Equp Backend API

A robust Node.js/Express backend for managing Equb (rotating savings group) operations, including user authentication, group management, payments, and role-based authorization.

---

## Table of Contents

- [Equp Backend API](#equp-backend-api)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Environment Variables](#environment-variables)
  - [Getting Started](#getting-started)
  - [API Overview](#api-overview)
    - [Authentication](#authentication)
    - [User Management](#user-management)
    - [Group Management](#group-management)
    - [Payments](#payments)
  - [Role-Based Access](#role-based-access)
  - [Super Admin Bootstrapping](#super-admin-bootstrapping)
  - [Development Scripts](#development-scripts)
  - [License](#license)
  - [Contributing](#contributing)

---

## Features

- JWT authentication and role-based authorization (`super_admin`, `group_admin`, `member`)
- User registration, login, profile, and role management
- Group creation, joining, admin assignment/removal, and member management
- Payment simulation and payout processing to winners' bank accounts
- Modular, scalable codebase with TypeScript and Mongoose
- Environment-based configuration

---

## Tech Stack

- **Node.js** / **Express**
- **TypeScript**
- **MongoDB** (via **Mongoose**)
- **JWT** for authentication
- **bcrypt** for password hashing
- **Joi** for validation
- **Winston** for logging

---

## Project Structure

```
equp/
├── src/
│   ├── config/           # Configuration files (env, JWT, etc.)
│   ├── controllers/      # Route controllers (user, group, payment, auth)
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/           # Mongoose schemas (User, Group, Transaction)
│   ├── routes/           # Express route definitions
│   ├── services/         # Business logic (user, group, payment, auth)
│   ├── types/            # TypeScript types and enums
│   ├── utils/            # Utilities (payment simulator, setup scripts)
│   └── validations/      # Joi validation schemas
├── .env                  # Environment variables
├── app.ts                # App entry point
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file in the root:

```
PORT=5000
MONGO_URI=your mongo uri
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1w
LOG_LEVEL=debug

# Super Admin Bootstrapping
SUPERADMIN_USERNAME=your-admin-name
SUPERADMIN_EMAIL=yoursuperadminemail@gmail.com
SUPERADMIN_PASSWORD=password
```

---

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Set up your `.env` file** (see above).

3. **Run the server in development:**
   ```sh
   npm run start:dev
   ```

4. **Build and run in production:**
   ```sh
   npm run build
   npm start
   ```

---

## API Overview

### Authentication

- `POST /api/v1/auth/register` — Register a new user (default role: member; only super_admin can create group_admin)
- `POST /api/v1/auth/login` — Login and receive JWT

### User Management

- `GET /api/v1/users/profile` — Get current user profile
- `PATCH /api/v1/users/profile/:id` — Update user profile
- `GET /api/v1/users/search?query=...` — Search users by username/email
- `PATCH /api/v1/users/:id/assign-role` — Assign a role (super_admin only)
- `PATCH /api/v1/users/:id/remove-role` — Remove a role (super_admin only)
- `DELETE /api/v1/users/profile/:id` — Delete a user (super_admin only)
- `GET /api/v1/users/` — List all users

### Group Management

- `POST /api/v1/groups/` — Create a group (super_admin only)
- `POST /api/v1/groups/:id/join` — Join a group
- `GET /api/v1/groups/:id` — Get group details
- `GET /api/v1/groups/:userId/user-groups` — Get groups for a user
- `GET /api/v1/groups/` — List all groups
- `PATCH /api/v1/groups/:id/assign-admin` — Assign group admin (super_admin or group_admin)
- `PATCH /api/v1/groups/:id/remove-admin` — Remove group admin (super_admin or group_admin)
- `PATCH /api/v1/groups/:id/remove-user` — Remove user from group (group_admin or super_admin)
- `DELETE /api/v1/groups/:id` — Delete a group (super_admin or group_admin)

### Payments

- `POST /api/v1/payments/` — Make a payment
- `POST /api/v1/payments/:groupId/payout` — Process payout to winner (group_admin or super_admin)
- `GET /api/v1/payments/:groupId/history` — Get payment history for a group

---

## Role-Based Access

- **super_admin**: Can create groups, assign/remove admins, assign/remove roles, delete users/groups, and process payouts.
- **group_admin**: Can manage group members, assign payouts, and manage group details.
- **member**: Can join groups, make payments, and view their own info.

Authorization is enforced via the `authorize` middleware in routes.

---

## Super Admin Bootstrapping

On first run, the app checks for a `super_admin` user.  
If none exists, it creates one using the credentials in your `.env` or `config.ts` file.

---

## Development Scripts

- `npm run start:dev` — Start server with hot reload (nodemon + ts-node)
- `npm run build` — Compile TypeScript to JavaScript
- `npm start` — Run compiled app

---

## License

[ISC](LICENSE)

---

## Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.

---