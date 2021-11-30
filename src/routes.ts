import express from 'express';
import path from 'path';
import { routes } from './api/routes';

const router = express.Router();

function staticAsset(name: string) {
  return path.join(__dirname + '/../' + name);
}

router.get('/', (req, res) => {
  res.sendFile(staticAsset('index.html'));
});

/* This binds all of the resources for the react site. */
router.use('/resources', express.static(__dirname + '/..'));

/* Bind all of the API endpoints. */
router.use('/api', routes);

export { router };
