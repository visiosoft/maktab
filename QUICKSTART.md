# Quick Start Guide

## Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Create Super Admin

```bash
cd backend
node initSuperAdmin.js
```

**Super Admin Credentials:**
- Email: `admin@maktab.com`
- Password: `Admin@123`

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 4. Access the Application

Open your browser and go to: `http://localhost:3000`

### 5. Login as Super Admin

Use the credentials above to login as Super Admin.

### 6. Create a Company

1. Click "Add Company" button
2. Fill in company details
3. Click "Create Company"

### 7. Create Company Admin

1. Click the "Add Admin" icon on a company card
2. Fill in admin details (username, email, password)
3. Click "Create Admin"

### 8. Login as Company Admin

1. Logout from Super Admin
2. Click "Company Admin" tab on login page
3. Use the credentials you created
4. Login to Company Admin dashboard

## Troubleshooting

### Backend not starting?
- Check if MongoDB connection string is correct in `backend/.env`
- Make sure port 5000 is not in use

### Frontend not starting?
- Make sure port 3000 is not in use
- Check if backend is running

### Can't login?
- Make sure you ran `node initSuperAdmin.js`
- Check backend console for errors
- Verify credentials are correct

## Important URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Super Admin Dashboard: `http://localhost:3000/super-admin/dashboard`
- Company Admin Dashboard: `http://localhost:3000/company-admin/dashboard`
