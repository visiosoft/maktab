# Maktab Frontend

Modern React.js frontend for the multi-company management system.

## Features

- Modern, responsive UI/UX with gradient designs
- Super Admin dashboard
- Company Admin dashboard
- Role-based access control
- JWT authentication
- Real-time updates

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the frontend directory (optional):

```
REACT_APP_API_URL=http://localhost:5000/api
```

If not set, it defaults to `http://localhost:5000/api`

## Running the Application

Development mode:
```bash
npm start
```

The app will run on `http://localhost:3000`

Build for production:
```bash
npm run build
```

## Default Login Credentials

### Super Admin
- Email: `admin@maktab.com`
- Password: `Admin@123`

### Company Admin
(Created by Super Admin)

## Pages

- `/login` - Login page for both Super Admin and Company Admin
- `/super-admin/dashboard` - Super Admin dashboard
- `/company-admin/dashboard` - Company Admin dashboard

## Components

- `Button` - Customizable button component
- `Card` - Card container component
- `Input` - Form input component
- `Modal` - Modal dialog component

## Tech Stack

- React 18
- React Router DOM 6
- Axios
- Lucide React (Icons)
- CSS3 with modern features
