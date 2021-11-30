import mongoose from 'mongoose';
import Redis from 'ioredis';
declare const redis: Redis.Redis;
declare const db: mongoose.Connection;
export { db, redis };
