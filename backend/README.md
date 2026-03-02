# Maktab Backend API

Multi-company management system backend with Super Admin and Company Admin roles.

## Features

- Super Admin can create and manage multiple companies
- Each company has its own Company Admin login
- JWT-based authentication
- Role-based access control
- RESTful API design

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the backend directory with:

```
MONGODB_URI=your_mongodb_connection_string
DB_NAME=Maktab
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
```

## Initialize Super Admin

Run this command to create the initial super admin account:

```bash
node initSuperAdmin.js
```

**Default Super Admin Credentials:**
- Email: `admin@maktab.com`
- Password: `Admin@123`

⚠️ **IMPORTANT:** Change the password after first login!

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (Super Admin or Company Admin)
- `POST /api/auth/verify` - Verify JWT token

### Super Admin
- `GET /api/super-admin/dashboard` - Get dashboard statistics
- `GET /api/super-admin/profile` - Get super admin profile

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create new company (Super Admin only)
- `GET /api/companies/:id` - Get company by ID
- `PUT /api/companies/:id` - Update company (Super Admin only)
- `DELETE /api/companies/:id` - Delete company (Super Admin only)
- `GET /api/companies/:id/admins` - Get all admins for a company
- `POST /api/companies/:id/admins` - Create admin for company (Super Admin only)
- `PUT /api/companies/:companyId/admins/:adminId` - Update company admin (Super Admin only)
- `DELETE /api/companies/:companyId/admins/:adminId` - Delete company admin (Super Admin only)

## Testing with curl

Login as Super Admin:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@maktab.com",
    "password": "Admin@123",
    "userType": "super_admin"
  }'
```
