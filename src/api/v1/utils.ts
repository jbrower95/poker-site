import {Profile, IProfile, IEvent} from '../schema';
import {Events} from '../../events';
import {ErrorCodes} from '../shared/consts';
import express from 'express'
import WebSocket from 'ws';

export async function validateToken(origin: string, token: string, ws: WebSocket): Promise<IProfile> {
  const profile = await Profile.findById(origin);
  if (token !== profile.token) {
    ws.send(JSON.stringify(Events.controlEventForPlayerWithId(origin).invalidAuth(`Invalid token '${token}' supplied for user '${origin}' with request.`)));
    ws.close(ErrorCodes.INVALID_AUTH);
  }

  return profile;
}

export async function getLoggedInUser(req: express.Request): Promise<IProfile | null> {
  const token = req.cookies.user;
  if (!token) {
    return null;
  }
  return await Profile.findOne({token});
}

export async function authRequired(
  req: express.Request, res: express.Response, next: express.NextFunction
): Promise<void> {
  console.log(`[INFO] Request from user ${req.cookies.user} (to ${req.originalUrl})`);
  const user = await getLoggedInUser(req);
  if (!user) {
    res.status(401);
    res.send({success: false, error: `Unauthorized user.`});
    throw new Error(`User unauthorized. (token ${user})`);
  }
  // call next middleware now that we know we're authenticated.
  next();
}
