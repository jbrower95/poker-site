import {TLoginPostData, TLoginResponse, TProfileCreateResponse, TProfileCreatePostData, TProfileResponse} from '../shared/requests';
import express from 'express';
import {Profile, IProfile} from '../schema';
import {IWireProfileModel} from '../shared/schema';
import crypto from 'crypto';
import {generateRandomUniqueToken} from '../token';
import { authRequired, getLoggedInUser } from './utils';

function sanitizeModel(profile: IProfile): IWireProfileModel {
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    pin: null, // no need to echo the password.
    salt: null, // no need to echo the salt..
    token: profile.token,
    created: profile.created,
    last_active: profile.last_active,
    hands_played: profile.hands_played,
    startingStack: profile.startingStack
  };
}

function meetsPasswordRequirement(password: string): boolean {
  // @todo [security] password security policy.
  return (
    password !== null && password !== undefined  &&
    password.length > 6 &&
    password.indexOf(' ') === -1 // no empty spaces
  );
}

function meetsUsernameRequirement(username: string): boolean {
  // @todo [security] username security policy.
  return (
    username !== null && username !== undefined  &&
    username.length > 6 &&
    username.indexOf(' ') === -1 // no empty spaces
  );
}

function meetsEmailRequirement(email: string): boolean {
  // @todo [security] actual policy for emails.
  return (
    email !== null && email !== undefined  &&
    email.indexOf('@') !== -1 && // gotta have an @ signs
    email.indexOf(' ') === -1 // no empty spaces
  );
}

function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export const routes = express.Router();

routes.get<null, TProfileResponse>('/', authRequired, async (req, res) => {
  const user = await getLoggedInUser(req);
  res.send({
    success: true,
    profile: sanitizeModel(user)
  });
});

routes.post<null, TProfileCreateResponse, TProfileCreatePostData>('/create', async (req, res) => {
  if (!meetsPasswordRequirement(req.body.pin)) {
    res.send({success: false, error: `Password "${req.body.pin}" does not meet security requirements.`});
    res.status(400);
    return;
  }

  if (!meetsUsernameRequirement(req.body.username)) {
    res.send({success: false, error: 'Invalid username.'});
    res.status(400);
    return;
  }

  if (!meetsEmailRequirement(req.body.email)) {
    res.send({success: false, error: 'Invalid email.'});
    res.status(400);
    return;
  }

  const usernameTaken = await Profile.exists({username: req.body.username});
  if (usernameTaken) {
    res.send({success: false, error: 'Username is taken.'});
    res.status(400);
    return;
  }

  const salt = crypto.randomBytes(12).toString('hex');
  const token = await generateRandomUniqueToken();

  const profile = new Profile({
    username: req.body.username,
    pin: hash(req.body.pin + salt),
    salt,
    token,
    last_active: new Date(),
    email: req.body.email,
    created: new Date()
  });
  await profile.save();
  res.send({success: true, profile: sanitizeModel(profile)});
});

routes.post<null, TLoginResponse, TLoginPostData>('/login', async (req, res) => {
  if (!req.body.username) {
    res.send({success: false, error: 'Invalid username.', profile: null});
    res.status(400);
    return;
  }

  const profile = await Profile.findOne({username: req.body.username});
  if (!profile) {
    res.send({success: false, error: 'User not found.', profile: null});
    res.status(400);
    return;
  }

  // see if the given password + the salt hash together to form the stored
  // password.
  const fullPassword = hash(req.body.password + profile.salt);
  if (fullPassword !== profile.pin) {
    // incorrect password.
    res.send({success: false, error: 'Incorrect password.', profile: null});
    res.status(400);
    return;
  }

  // login the user.
  profile.token = await generateRandomUniqueToken();
  await profile.save();

  const data: TLoginResponse = {success: true, profile: sanitizeModel(profile)};
  res.send(data);
});
