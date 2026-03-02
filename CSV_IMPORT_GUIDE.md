# CSV Import Guide for Passengers

## Overview
The passenger management system supports bulk import of passengers from CSV files. This allows you to quickly add multiple passengers at once instead of entering them one by one.

## CSV File Format

Your CSV file must have the following columns (in any order):

### Required Columns:
- **firstName**: Passenger's first name
- **lastName**: Passenger's last name
- **passportNo**: Passport number (will be automatically converted to uppercase)

### Optional Columns:
- **groupName**: Name of the group to assign the passenger to (must match an existing group name exactly, leave empty for no group)

### Alternative Column Names Supported:
The system is flexible and also accepts these alternative column names:
- `first_name` instead of `firstName`
- `last_name` instead of `lastName`
- `passport_no` or `passportNumber` instead of `passportNo`
- `group` instead of `groupName`

## Sample CSV Format

```csv
firstName,lastName,passportNo,groupName
Ahmad,Ahmed,A1234567,Group A
Fatima,Hassan,B2345678,Group B
Mohammed,Ali,C3456789,
Sarah,Khan,D4567890,Group A
Omar,Ibrahim,E5678901,
```

## How to Import

1. **Download the Sample Template**: 
   - Click the "Download Sample CSV" link below the "Import CSV" button
   - Or use the provided `sample-passenger-import.csv` file from the project folder

2. **Prepare Your CSV File**: 
   - Open the downloaded sample template
   - Replace the sample data with your passenger information
   - Ensure all required fields are filled
   - Save the file with `.csv` extension

3. **Import Process**:
   - Navigate to the Company Admin Dashboard
   - Click the "Import CSV" button in the Passengers section
   - Select your prepared CSV file
   - Wait for the import to complete

4. **Review Results**:
   - A success message will show how many passengers were imported
   - If any rows failed, the count will be displayed
   - Failed imports typically occur due to:
     - Missing required fields
     - Duplicate passport numbers
     - Invalid group names

## Important Notes

- **Passport numbers must be unique**: If a passport number already exists in your company's database, that row will be skipped
- **Group names are case-insensitive**: "Group A" and "group a" will match the same group
- **Group names must exist**: Make sure to create groups first before importing passengers assigned to them
- **Empty group field**: Leave the groupName field empty or omit it if the passenger is not assigned to any group
- **Automatic uppercase**: Passport numbers are automatically converted to uppercase for consistency

## Troubleshooting

### Import Failed
- **Check file format**: Ensure you're uploading a `.csv` file
- **Verify required fields**: Make sure firstName, lastName, and passportNo are present in every row
- **Check group names**: Verify that group names in your CSV match existing groups exactly

### Some Passengers Not Imported
- Check the error count in the success message
- Common issues:
  - Duplicate passport numbers
  - Missing required data
  - Invalid group names
- Fix the errors in your CSV and re-import the failed rows

## Tips for Best Results

1. **Download the sample template**: Click "Download Sample CSV" link in the dashboard for the correct format
2. **Test with a small file first**: Import 2-3 passengers to verify your format is correct
3. **Create groups first**: Set up all your groups before importing passengers
4. **Clean your data**: Remove any extra spaces or special characters
5. **Backup your data**: Keep a copy of your CSV file before importing

## Example Workflow

1. Create groups (if assigning passengers to groups)
2. Click "Download Sample CSV" link in the dashboard
3. Fill in your passenger data in the downloaded template
4. Save the file as `.csv`
5. Click "Import CSV" on the dashboard
6. Select your file
7. Review the success message
8. Check the passenger list to verify all data was imported correctly
