/**
 * Migration script to update old groups with new hotel fields
 * Run this once to migrate existing groups to use arrivalHotel and departureHotel
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected for migration');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

const migrateGroups = async () => {
    try {
        await connectDB();

        const db = mongoose.connection.db;
        const groupsCollection = db.collection('groups');

        // Find all groups that have the old 'hotel' field but not the new fields
        const oldGroups = await groupsCollection.find({
            $or: [
                { arrivalHotel: { $exists: false } },
                { departureHotel: { $exists: false } },
                { arrivalCity: { $exists: false } },
                { departureCity: { $exists: false } }
            ]
        }).toArray();

        console.log(`Found ${oldGroups.length} groups to migrate`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const group of oldGroups) {
            const updateFields = {};

            // If old 'hotel' field exists, use it for both arrival and departure
            if (group.hotel) {
                if (!group.arrivalHotel) {
                    updateFields.arrivalHotel = group.hotel;
                }
                if (!group.departureHotel) {
                    updateFields.departureHotel = group.hotel;
                }
            }

            // Set default cities if not present
            // Default to Makkah if not specified
            if (!group.arrivalCity) {
                updateFields.arrivalCity = 'Makkah';
            }
            if (!group.departureCity) {
                updateFields.departureCity = 'Madinah';
            }

            // Remove old numberOfPax field if it exists
            const unsetFields = {};
            if (group.numberOfPax !== undefined) {
                unsetFields.numberOfPax = '';
            }

            if (Object.keys(updateFields).length > 0 || Object.keys(unsetFields).length > 0) {
                const updateOperation = {};
                if (Object.keys(updateFields).length > 0) {
                    updateOperation.$set = updateFields;
                }
                if (Object.keys(unsetFields).length > 0) {
                    updateOperation.$unset = unsetFields;
                }

                await groupsCollection.updateOne(
                    { _id: group._id },
                    updateOperation
                );

                console.log(`✓ Migrated group: ${group.groupName} (${group._id})`);
                migratedCount++;
            } else {
                console.log(`- Skipped group: ${group.groupName} (already up to date)`);
                skippedCount++;
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Migrated: ${migratedCount} groups`);
        console.log(`Skipped: ${skippedCount} groups`);
        console.log(`Total processed: ${oldGroups.length} groups`);

        console.log('\nNote: Groups without hotels will need to be manually updated through the UI.');
        console.log('Default cities were set to: Arrival=Makkah, Departure=Madinah');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

// Run migration
migrateGroups();
