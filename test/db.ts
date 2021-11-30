import mongoose from 'mongoose';
import {expect} from 'chai';
import {Event, Table, Hand, Profile} from '../src/api/schema';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
const waitPort = require('wait-port');

let mongod : MongoMemoryServer | null = null;


export const PORT = parseInt(process.env.PORT) || 5000;
let SERVER_PROCESS: ChildProcessWithoutNullStreams | null = null;

export const useInMemoryServer = async () => {
  /**
   * Connect to a new in-memory database before running any tests.
   */
  beforeAll(async () => {
    await connectToInMemoryDb();
    console.log('[INFO] Connected to in-memory mongodb.');
  });

  /**
   * Clear all test data after every test.
   */
  afterEach(async () => await clearDatabase());

  /**
   * Remove and close the db and server when done testing.
   */
  afterAll(async () => await closeInMemoryDatabase());
};

const connectToInMemoryDb = async () => {
  if (!mongod) {
    mongod = new MongoMemoryServer();
  }
  const uri = await mongod.getConnectionString();

    const mongooseOpts = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
    await mongoose.connect(uri, mongooseOpts);

    // seed the db.
    await setupDb();
}

const closeInMemoryDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
  mongod = null;
};

/**
 * Connect to the in-memory database.
 */
export const setupDb = async () => {
    // seed the db.
    await Promise.all([
      Profile.createCollection(),
      Event.createCollection(),
      Table.createCollection(),
      Hand.createCollection()]);
}

export const setupLocalServer = async () => {
    // set up the fake database.
    const command = 'make';
    const args = [
      'local'
    ];
    const options = {
      shell: true,
      cwd: process.cwd()
    };
    SERVER_PROCESS = spawn(
      command,
      args,
      options,
    );
    SERVER_PROCESS.stdout.on('data', (data) => {
      console.log(`server: ${data}`);
    });
    SERVER_PROCESS.stderr.on('data', (data) => {
      console.log(`server: ${data}`);
    });
    console.log('[INFO] Testing server spawned: pid- ' + SERVER_PROCESS.pid);

    const isOpen = await waitPort({port: PORT});
    expect(isOpen).to.be.true;
    console.log('[OK] Test server running!');
  };


/**
 * Remove all the data for all db collections.
 */
export const clearDatabase = async () => {
  await Promise.all([
    Profile.deleteMany({}),
    Event.deleteMany({}),
    Table.deleteMany({}),
    Hand.deleteMany({})
  ]);
}
