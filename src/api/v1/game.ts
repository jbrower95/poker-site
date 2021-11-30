import express from 'express';
import {Table} from '../schema';
import {GameType} from '../shared/consts';
import {ITableModel} from '../shared/schema';
import {TTableCreateResponse, TTableCreatePostData} from '../shared/requests';
import {authRequired, getLoggedInUser} from './utils';
import cryptoRandomString from 'crypto-random-string';

export const routes = express.Router();
routes.use(authRequired); // all routes on this endpoint require authentication.


async function genUniqueInviteCode(maxAttempts: number = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    // TODO(security): We may need more ids than this.
    const inviteCode = cryptoRandomString({length: 5, type: 'distinguishable'});

    // see if this exists.
    const inUse = await Table.exists({
      inviteCode
    });

    // TODO(correctness)- This is a medium-danger race condition. These ids may clash.
    if (!inUse) {
      return inviteCode;
    }
  }

  throw new Error('Failed to generate invite code.');
}


/**
 * Create a new table, with the current logged in user as the host.
 */
routes.post<null, TTableCreateResponse, TTableCreatePostData>('/create', async (req, res) => {
  const user = await getLoggedInUser(req);

  const config = req.body.config;
  if (config.game !== GameType.HOLDEM) {
    throw new Error(`Unknown game type ${config.game} specified.`);
  }

  if (config.bigBlind <= 0 || config.smallBlind <= 0 || config.bigBlind < config.smallBlind) {
    throw new Error(`Invalid blinds specified.`);
  }

  const code = await genUniqueInviteCode();

  const table = new Table({
    host: user._id,
    seats: [],
    hand_ids: [],
    config,
    inviteCode: code
  });
  await table.save();

  const tableObj: ITableModel =
    {
     host: user.id,
     id: table.id,
     config,
     seats: table.seats.map((seat) => seat.toString()),
     inviteCode: code
   };
  res.send({success: true, table: tableObj});
});
