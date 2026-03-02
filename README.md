# Maktab - Multi-Company Management System

A modern, full-stack multi-company management system with Super Admin and Company Admin roles built with React.js and Express.js.

![Maktab](https://img.shields.io/badge/Version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![Express](https://img.shields.io/badge/Express-4.18.2-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## 🚀 Features

- **Super Admin Portal**
  - Create and manage multiple companies
  - Create company admin accounts for each company
  - View dashboard statistics
  - Manage all companies from one place

- **Company Admin Portal**
  - View company information
  - Manage company data
  - Secure authentication

- **Modern UI/UX**
  - Beautiful gradient designs
  - Responsive layout
  - Smooth animations
  - Intuitive navigation

- **Security**
  - JWT-based authentication
  - Password hashing with bcrypt
  - Role-based access control
  - Protected API routes

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (credentials provided)

## 🛠️ Installation

### 1. Clone or Navigate to Project Directory

```bash
cd G:\Maktab
```

### 2. Setup Backend

```bash
cd backend
npm install
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

## 🔧 Configuration

The MongoDB credentials are already configured in `backend/.env`:

```
MONGODB_URI=mongodb+srv://devxulfiqar:nSISUpLopruL7S8j@mypaperlessoffice.z5g84.mongodb.net/?retryWrites=true&w=majority&appName=mypaperlessoffice
DB_NAME=Maktab
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 🚀 Running the Application

### 1. Initialize Super Admin (First Time Only)

```bash
cd backend
node initSuperAdmin.js
```

This will create the initial Super Admin account with these credentials:
- **Email:** `admin@maktab.com`
- **Password:** `Admin@123`

⚠️ **IMPORTANT:** Change this password after first login!

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Start Frontend (New Terminal)

```bash
cd frontend
npm start
```

Frontend will run on `http://localhost:3000`

## 🔐 Login Credentials

### Super Admin
- Email: `admin@maktab.com`
- Password: `Admin@123`

### Company Admin
Company admins are created by the Super Admin. After creating a company, the Super Admin can create admin accounts for that company.

## 📱 Usage

### Super Admin Workflow

1. Login with Super Admin credentials
2. View dashboard statistics
3. Click "Add Company" to create a new company
4. Fill in company details (name, email, phone, industry, website)
5. Click on "Add Admin" icon on a company card to create a company admin
6. Provide admin details and credentials
7. Company admin can now login with their credentials

### Company Admin Workflow

1. Login with credentials provided by Super Admin
2. View company information
3. Manage company data

## 🏗️ Project Structure

```
Maktab/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── SuperAdmin.js         # Super Admin model
│   │   ├── Company.js            # Company model
│   │   └── CompanyAdmin.js       # Company Admin model
│   ├── middleware/
│   │   └── auth.js               # Authentication middleware
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── superAdmin.js         # Super Admin routes
│   │   └── companies.js          # Company routes
│   ├── initSuperAdmin.js         # Super Admin initialization script
│   ├── server.js                 # Express server
│   ├── package.json
│   └── .env                      # Environment variables
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Button.js         # Button component
    │   │   ├── Card.js           # Card component
    │   │   ├── Input.js          # Input component
    │   │   └── Modal.js          # Modal component
    │   ├── contexts/
    │   │   └── AuthContext.js    # Authentication context
    │   ├── pages/
    │   │   ├── Login.js          # Login page
    │   │   ├── SuperAdminDashboard.js
    │   │   └── CompanyAdminDashboard.js
    │   ├── services/
    │   │   └── api.js            # API service
    │   ├── App.js                # Main App component
    │   ├── index.js
    │   └── index.css
    ├── package.json
    └── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/verify` - Verify token

### Super Admin
- `GET /api/super-admin/dashboard` - Dashboard stats
- `GET /api/super-admin/profile` - Profile

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create company
- `GET /api/companies/:id` - Get company by ID
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `GET /api/companies/:id/admins` - Get company admins
- `POST /api/companies/:id/admins` - Create company admin
- `PUT /api/companies/:companyId/admins/:adminId` - Update admin
- `DELETE /api/companies/:companyId/admins/:adminId` - Delete admin

## 🎨 UI/UX Features

- Gradient backgrounds
- Smooth animations
- Responsive design
- Modern card-based layout
- Icon integration with Lucide React
- Beautiful color schemes
- Hover effects
- Modal dialogs
- Form validation

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes
- Role-based authorization
- Input validation
- Secure HTTP headers
- CORS configured

## 🛡️ Technologies Used

### Backend
- Express.js - Web framework
- MongoDB - Database
- Mongoose - ODM
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- cors - CORS middleware
- dotenv - Environment variables

### Frontend
- React.js - UI library
- React Router DOM - Routing
- Axios - HTTP client
- Lucide React - Icons
- CSS3 - Styling

## 📝 Notes

- Make sure MongoDB Atlas is accessible
- Change JWT_SECRET in production
- Change default Super Admin password after first login
- The system supports multiple companies with separate admin logins
- All API routes are protected with JWT authentication

## 🤝 Support

For any issues or questions, please check the documentation or contact support.

## 📄 License

ISC

---

**Created with ❤️ for Maktab**
