import mongoose from 'mongoose';
import config from './config'; 
import logger from '../utils/logger';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if no server is available
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
 
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Mongoose connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed due to app termination');
      process.exit(0);
    });

  } catch (err) {
    if (err instanceof Error) {
      logger.error(`Database connection error: ${err.message}`);
    } else {
      logger.error(`Database connection error: ${String(err)}`);
    }
    process.exit(1);
  }
};

export default connectDB; 