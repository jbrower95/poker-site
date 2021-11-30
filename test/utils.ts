import {Actions} from '../src/actions';
import {Game} from '../src/api/game';
import {Deck} from '../src/api/deck';
import {Profile, Table, Hand} from '../src/api/schema';
import {ITableConfig} from '../src/api/shared/schema';


export interface ITestPlayer {
  name: string,
  cards: Array<string>,
  startingStack: number
}

export interface ITest {
  game: Game,
  profiles: Array<Actions>
}

export async function checkAround(game: Game) {
  for (let i = 0; i < game.hand.players.length; i++) {
    const idx = (i + 1) % game.hand.players.length;
    if (game.hand.players[idx].hasAction && game.hand.players[idx].inHand) {
      const action = Actions.forPlayer(game.hand.players[idx], game.hand).check();
      await game.processAction(action);
    }
  }
}

export function testPlayer(name: string, cards: Array<string>, startingStack: number): ITestPlayer {
  return {
    name,
    cards,
    startingStack
  };
}

/**
 * Sets up a new table, (and saves the resulting object)
 * in memory, using the given data.
 */
export async function gameWithPlayers(players: Array<ITestPlayer>, config: ITableConfig, deck: Deck): Promise<ITest> {

  // make profiles for all of these players.
  const profiles = await Promise.all(
    players.map(async (player) => {
      const profile = new Profile({
        username: player.name,
        pin: '1234',    /* the four number pin to rejoin */
        salt: '5678',
        email: player.name + '@thenuts.com',
        token: 'a',
        secret: 'empty', /* current auth */
        last_active: new Date(), /* Last time the user did something.*/
      });
      await profile.save();
      return profile;
    })
  );

  const seats = profiles.map((profile) => profile._id);

  const table = new Table({
    seats: seats, /* Array of player ids. */
    hand_ids: [], /* the hands played here. */
    config: config,
  });

  await table.save();

  const table_players = players.map((player, idx) => {
    return {
      profile: seats[idx], /* objectId to a profile. */
      seat: idx,
      stack: player.startingStack,
      cards: player.cards,
      inHand: true
    };
  });

  // reverse engineer the deck that would've produced this layout.
  let cards = [];
  for (let i = 0; i < table_players.length; i++) {
    cards = cards.concat(table_players[i].cards);
  }
  cards = cards.concat(deck.cards.split("").map((c) => Deck.base64toPokerSolver(c)));

  // set up the hand.
  const hand = new Hand({
    table: table._id,
    players: table_players,
    button: 0,
    deck: Deck.fromCards(cards)
  });
  await hand.save();

  return {
    game: new Game(table, hand),
    profiles: hand.players.map((player) => Actions.forPlayer(player, hand))
  };
}
