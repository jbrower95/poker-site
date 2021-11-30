import express from 'express';
import {authRequired} from './utils';

export const routes = express.Router();
routes.use(authRequired); // all routes authenticated on this subdomain.

/**
 * List all of the events that have happened in this game so far.
 */
routes.get('/events', (_req, _res) => {
  throw new Error('Unimplemented.');
});
