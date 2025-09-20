const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./Model/userModel');
const Session = require('./Model/sessionModel');

const connectDB = require('./Config/connectDb');

const populateData = async () => {
  try {
    await connectDB();
    console.log('Populating sample data...');

    // --- 1. Clear existing data ---
    console.log('Clearing old data...');
    await User.deleteMany({});
    await Session.deleteMany({});
    console.log('Old data cleared successfully.');

    // --- 2. Create sample users ---
    console.log('Creating sample users...');
    const users = await User.insertMany([
      { username: 'user1', email: 'user1@example.com' },
      { username: 'testuser', email: 'testuser@example.com' },
      { username: 'devuser', email: 'devuser@example.com' }
    ]);
    console.log(`${users.length} users created.`);
    
    const user1Id = users[0]._id;
    const testUserId = users[1]._id;

    // --- 3. Create sample sessions linked to users ---
    console.log('Creating sample sessions...');
    await Session.insertMany([
      {
        userId: user1Id,
        userIdea: 'A mobile app for finding hiking trails',
        status: 'complete',
        clarifierOutput: {
          questions: ['What features are essential?', 'What is your target audience?'],
          draftRequirements: {
            features: ['Map with trails', 'User reviews', 'Photo sharing']
          }
        },
        validatorOutput: {
          feasibilityReport: {
            technical: 'Geolocalization and maps are well-supported.',
            market: 'Niche market, but growing.',
            business: 'Revenue could come from premium features.'
          },
          riskLevel: 'low'
        },
      },
      {
        userId: testUserId,
        userIdea: 'A social media platform for pet owners',
        status: 'started',
      },
    ]);
    console.log('Sessions created.');

    console.log('\nData population complete! 🎉');
  } catch (err) {
    console.error('Error populating data:', err);
    process.exit(1);
  } finally {
    // --- 4. Disconnect from the database ---
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

populateData();