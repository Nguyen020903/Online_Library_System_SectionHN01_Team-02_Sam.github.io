const Agenda = require('agenda');
const mongoose = require('mongoose');

// Replace 'your-database-name' and 'your-mongo-uri' with your actual database name and connection URI
const mongoURI = 'your-mongo-uri';
const databaseName = 'your-database-name';

mongoose.connect(`${mongoURI}/${databaseName}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model('User', {
  email: String,
  // ... other user schema fields
  updatedAt: Date,
});

const agenda = new Agenda({ db: { address: mongoURI, collection: 'agendaJobs' } });

agenda.define('deleteInactiveUsers', async (job) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find users whose updatedAt is older than seven days
    const inactiveUsers = await User.find({ updatedAt: { $lt: sevenDaysAgo } });

    // Delete each inactive user
    await Promise.all(inactiveUsers.map((user) => user.remove()));

    console.log(`Deleted ${inactiveUsers.length} inactive users`);
  } catch (error) {
    console.error('Error deleting inactive users:', error);
  }
});

(async () => {
  await agenda.start();

  // Schedule the job to run every day
  await agenda.every('24 hours', 'deleteInactiveUsers');
})();
