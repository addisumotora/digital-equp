import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Global test setup
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  
  console.log('Connected to in-memory MongoDB for testing');
});

afterAll(async () => {
  // Clean up
  await mongoose.disconnect();
  await mongoServer.stop();
  
  console.log('Disconnected from in-memory MongoDB');
});

// Clean up database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.NODE_ENV = 'testing';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.LOG_LEVEL = 'error'; // Reduce logging during tests 