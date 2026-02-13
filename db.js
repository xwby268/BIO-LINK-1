const { MongoClient } = require('mongodb');
const config = require('./config');

const uri = config.MONGODB_URI;
let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your Mongo URI to environment variables');
}

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable so the connection is preserved
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, it's better to not reuse the client across function invocations
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

module.exports = clientPromise;