import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { gameWithPlayers, testPlayer, checkAround } from '../../utils';
import {Deck} from '../../../src/api/deck';
import { GameState } from '../../../src/api/shared/consts';
import {useInMemoryServer} from '../../db';

chai.use(chaiAsPromised);
chai.should();
const expect = chai.expect;


describe('holdem: all in tests', () => {
  useInMemoryServer();

  it('simple all-in and call', async () => {
      const test = await gameWithPlayers([
        testPlayer('david', ['Ah', 'Ad'], 50),
        testPlayer('justin', ['Kh', 'Kd'], 100),
        testPlayer('serge', ['Qh', 'Qd'], 200),
      ],
      {smallBlind: 1, bigBlind: 2, game: 0},
      Deck.fromCards(['2s', '3s', '6d', '9h', '4c'])
    );
    const game = test.game;
    const [pDavid, pJustin, pSerge] = test.profiles;

    await game.begin();

    expect(game.hand.players.length).to.equal(3);

    await game.processAction(pDavid.bet(50, true));
    await game.processAction(pJustin.bet(100, true));
    await game.processAction(pSerge.call());

    // hand ends, 2 pots.
    // main pot: 150 - david
    // side pot: 100 - justin
    expect(game.hand.state).to.equal(GameState.SHOWDOWN);

    expect(game.hand.players[0].stack).to.equal(150); // +100
    expect(game.hand.players[1].stack).to.equal(100); // -/+ 0
    expect(game.hand.players[2].stack).to.equal(100); // -100
  });
});
