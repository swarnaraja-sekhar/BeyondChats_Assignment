require('dotenv').config();
const mongoose = require('mongoose');

const action = process.argv[2] || 'reset';

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        if (action === 'delete') {
            const result = await mongoose.connection.db.collection('articles').deleteMany({});
            console.log(`Deleted ${result.deletedCount} articles`);
        } else {
            const result = await mongoose.connection.db.collection('articles').updateMany(
                {},
                { $set: { isEnhanced: false, enhancedContent: null, references: [] } }
            );
            console.log(`Reset ${result.modifiedCount} articles`);
        }
        
        await mongoose.disconnect();
        console.log('Done!');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

run();
