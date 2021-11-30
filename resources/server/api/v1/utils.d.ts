import { IProfile } from '../schema';
import express from 'express';
import WebSocket from 'ws';
export declare function validateToken(origin: string, token: string, ws: WebSocket): Promise<IProfile>;
export declare function getLoggedInUser(req: express.Request): Promise<IProfile | null>;
export declare function authRequired(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void>;
