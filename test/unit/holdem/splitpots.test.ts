import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { gameWithPlayers, testPlayer, checkAround } from '../../utils';
import {Deck} from '../../../src/api/deck';
import { GameState } from '../../../src/api/shared/consts';
import {useInMemoryServer} from '../../db';

chai.use(chaiAsPromised);
chai.should();
const expect = chai.expect;


describe('holdem: split pot tests', () => {
  useInMemoryServer();

  it('split pot', async () => {
      const test = await gameWithPlayers([
        testPlayer('david', ['Ah', 'Ad'], 100),
        testPlayer('justin', ['As', 'Ac'], 100),
        testPlayer('serge', ['Qh', 'Qd'], 100),
      ],
      {smallBlind: 1, bigBlind: 2, game: 0},
      Deck.fromCards(['2s', '3s', '6d', '9h', '4c'])
    );
    const game = test.game;
    const [pDavid, pJustin, pSerge] = test.profiles;

    await game.begin();

    expect(game.hand.players.length).to.equal(3);

    await game.processAction(pDavid.bet(25, true));
    await game.processAction(pJustin.bet(50)); // 50
    await game.processAction(pSerge.fold()); // -2
    await game.processAction(pDavid.call()); // 50

    expect(game.hand.state).to.equal(GameState.POSTFLOP);

    await game.processAction(pJustin.check());
    await game.processAction(pDavid.bet(50, true));
    await game.processAction(pJustin.call());

    expect(game.hand.state).to.equal(GameState.SHOWDOWN);

    // david + justin split pot with AA.
    expect(game.hand.players[0].stack).to.equal(101); // +1
    expect(game.hand.players[1].stack).to.equal(101); // +1
    expect(game.hand.players[2].stack).to.equal(98); // -2
  });
});
