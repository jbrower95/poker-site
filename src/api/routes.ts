import express from 'express';
import expressWs from 'express-ws';
import {routes as routes_V1} from './v1/routes';

const routes = express.Router() as expressWs.Router;

/*
 * All API versions.
 *  When we want to introduce a new API, we can add another subdomain here.
 */
routes.use('/v1', routes_V1);

export { routes }
