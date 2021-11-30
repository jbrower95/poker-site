import mongoose from 'mongoose';
import Redis from 'ioredis';

const redis: Redis.Redis = new Redis(process.env.REDIS_URL);

const DB_URL: string = process.env.MONGODB_URI
mongoose.connect(DB_URL);
const db = mongoose.connection;

export {db, redis}
