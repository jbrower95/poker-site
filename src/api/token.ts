import {Profile} from './schema';
import cryptoRandomString from 'crypto-random-string';

export async function generateRandomUniqueToken(): Promise<string> {

  // ten attempts.
  for (let i = 0; i < 10; i++) {
    const token = cryptoRandomString({length: 20, type: 'base64'});

    // see if this exists.
    const inUse = await Profile.exists({
      token
    });

    // TODO(correctness)- This is a low-danger race condition.
    if (!inUse) {
      return token;
    }
  }

  throw new Error('Failed to generate session token.');
}
