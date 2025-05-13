const { MongoClient, ObjectId } = require('mongodb');

process.env.MONGODB_URI = 'mongodb://21225133:TmApFpxgFz9KZRNIkDppnqJcfXGAlJDmmsoE7rfLo4WppbAPJJyHzUIDZLUHiXrnSl4yQfvekzhNACDbkPKxxA==@21225133.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@21225133@';
// this is correct
if (!process.env.MONGODB_URI) {
    // throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    process.env.MONGODB_URI = 'mongodb://localhost:27017';
}

// Connect to MongoDB
async function connectToDB() {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('bookingsDB');
    db.client = client;
    return db;
}


module.exports = { connectToDB, ObjectId };