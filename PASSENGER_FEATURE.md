# Passenger Management Feature

## Overview

Company admins can now add and manage passenger lists with an Excel-like inline editing experience.

## Features

### For Company Admins:

1. **Add Passengers**: Click "Add Passenger" to add a new row
2. **Inline Editing**: Click on any cell to edit directly in the table
3. **Quick Navigation**: Use Tab to move between fields
4. **Search**: Search passengers by name, passport number, nationality, or email
5. **Delete**: Remove passengers with a single click

### Passenger Fields:

- **First Name** * (Required)
- **Last Name** * (Required)
- **Passport No.** * (Required)
- **Nationality** (Optional)
- **Date of Birth** (Optional)
- **Passport Expiry** (Optional)
- **Email** (Optional)
- **Phone** (Optional)

## How to Use

### Adding a New Passenger

1. Login as Company Admin
2. Navigate to your dashboard
3. Scroll to the "Passenger List" section
4. Click "Add Passenger" button
5. Fill in the required fields (marked with *)
6. Click the Save icon (checkmark) or press Tab to save
7. Click the Cancel icon (X) to discard changes

### Editing an Existing Passenger

1. Click on any cell in the passenger row you want to edit
2. The row will enter edit mode with all fields editable
3. Make your changes
4. Click the Save icon to save changes
5. Click the Cancel icon to discard changes

### Deleting a Passenger

1. Click the Delete icon (trash) on the passenger row
2. Confirm the deletion in the popup dialog

### Searching Passengers

1. Use the search box at the top right
2. Type to filter by:
   - First Name
   - Last Name
   - Passport Number
   - Nationality
   - Email

## Design Features

- **Modern UI**: Beautiful gradient colors and smooth animations
- **Responsive**: Works on all screen sizes
- **Excel-like**: Familiar spreadsheet-style editing
- **Visual Feedback**: 
  - New rows highlighted in blue
  - Editing rows highlighted in yellow
  - Hover effects for better visibility
  - Color-coded action buttons

## API Endpoints

### Get All Passengers
```
GET /api/passengers
```
Returns all passengers for the authenticated company admin's company.

### Create Passenger
```
POST /api/passengers
Body: {
  firstName: string (required),
  lastName: string (required),
  passportNo: string (required),
  nationality: string (optional),
  dateOfBirth: date (optional),
  passportExpiry: date (optional),
  email: string (optional),
  phone: string (optional)
}
```

### Update Passenger
```
PUT /api/passengers/:id
Body: Same as create
```

### Delete Passenger
```
DELETE /api/passengers/:id
```

### Get Stats
```
GET /api/passengers/stats
```

## Validation

- Passport numbers are automatically converted to uppercase
- Duplicate passport numbers within the same company are not allowed
- Email format is validated
- Required fields are enforced

## Security

- Company admins can only view and manage passengers for their own company
- All routes are protected with JWT authentication
- Role-based access control ensures only company admins can access passenger data

## Tips

- Press Tab to quickly move between fields when adding/editing
- Click anywhere outside the edit mode to see changes without saving (then click Cancel to discard)
- Use the search to quickly find specific passengers
- The table shows real-time counts of total and filtered passengers
