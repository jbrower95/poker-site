import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { gameWithPlayers, testPlayer, checkAround } from '../../utils';
import {Deck} from '../../../src/api/deck';
import { GameState } from '../../../src/api/shared/consts';
import {useInMemoryServer} from '../../db';

chai.use(chaiAsPromised);
chai.should();
const expect = chai.expect;

describe('holdem: basic tests', () => {
  useInMemoryServer();

  it('fold around ends game', async () => {
      const test = await gameWithPlayers([
        testPlayer('david', ['Ah', 'Ad'], 100),
        testPlayer('justin', ['Kh', 'Kd'], 100),
        testPlayer('serge', ['Qh', 'Qd'], 100),
        testPlayer('ethan', ['Jh', 'Jd'], 100)
      ],
      {smallBlind: 1, bigBlind: 2, game: 0},
      Deck.newDeck()
    );
    const game = test.game;
    const [pDavid, pJustin,, pEthan] = test.profiles;

    await game.begin();

    await game.processAction(pEthan.fold());
    await game.processAction(pDavid.fold());
    await game.processAction(pJustin.fold());

    expect(game.hand.state).to.equal(GameState.SHOWDOWN);
    // expect the winners to be updated.

    expect(game.hand.players[0].stack).to.equal(100); // unchanged.
    expect(game.hand.players[1].stack).to.equal(99); // -1 chip for justin.
    expect(game.hand.players[2].stack).to.equal(101); // +1 chip
    expect(game.hand.players[3].stack).to.equal(100); // unchanged.
  });

  it('best hand wins simple', async () => {
      const test = await gameWithPlayers([
        testPlayer('david', ['Ah', 'Ad'], 100),
        testPlayer('justin', ['Kh', 'Kd'], 100),
        testPlayer('serge', ['Qh', 'Qd'], 100),
      ],
      {smallBlind: 1, bigBlind: 2, game: 0},
      Deck.fromCards(['2s', '3s', '6d', '9h', '4c'])
    );
    const game = test.game;
    const [pDavid, pJustin, pSerge] = test.profiles;

    await game.begin();

    // all players start with action.
    expect(game.hand.players[0].hasAction).to.be.true;
    expect(game.hand.players[1].hasAction).to.be.true;
    expect(game.hand.players[2].hasAction).to.be.true;

    expect(game.hand.players.length).to.equal(3);

    await game.processAction(pDavid.call());
    await game.processAction(pJustin.call());
    await game.processAction(pSerge.check()); // big blind has option here.

    expect(game.hand.state).to.equal(GameState.POSTFLOP);
    expect(game.hand.pots[0].size).to.equal(6); //just the blinds.

    await checkAround(game);

    expect(game.hand.state).to.equal(GameState.POSTTURN);
    expect(game.hand.pots[0].size).to.equal(6); //just the blinds.

    await checkAround(game);

    expect(game.hand.state).to.equal(GameState.POSTRIVER);
    expect(game.hand.pots[0].size).to.equal(6); //just the blinds.

    await checkAround(game);

    expect(game.hand.players[0].stack).to.equal(104); // +4.
    expect(game.hand.players[1].stack).to.equal(98); // -2
    expect(game.hand.players[2].stack).to.equal(98); // -2
  });

  it('simple pre-flop raise + fold', async () => {
      const test = await gameWithPlayers([
        testPlayer('david', ['Ah', 'Ad'], 100),
        testPlayer('justin', ['Kh', 'Kd'], 100),
        testPlayer('serge', ['Qh', 'Qd'], 100),
      ],
      {smallBlind: 1, bigBlind: 2, game: 0},
      Deck.fromCards(['2s', '3s', '6d', '9h', '4c'])
    );
    const game = test.game;
    const [pDavid, pJustin, pSerge] = test.profiles;

    await game.begin();

    expect(game.hand.players.length).to.equal(3);

    await game.processAction(pDavid.bet(5));
    await game.processAction(pJustin.fold());

    // serge can't check here.
    Promise.resolve(game.processAction(pSerge.check())).should.eventually.be.rejected;

    // serge re-raises.
    await game.processAction(pSerge.bet(10));

    // david can't check.
    Promise.resolve(game.processAction(pDavid.check())).should.eventually.be.rejected;

    // so he folds.
    await game.processAction(pDavid.fold());

    // hand ends, serge wins.
    expect(game.hand.state).to.equal(GameState.SHOWDOWN);

    expect(game.hand.players[0].stack).to.equal(95); // -5.
    expect(game.hand.players[1].stack).to.equal(99); // -1
    expect(game.hand.players[2].stack).to.equal(106); // +6
  });



  it('simple fold and call', async () => {
      const test = await gameWithPlayers([
        testPlayer('david', ['Ah', 'Ad'], 100),
        testPlayer('justin', ['Kh', 'Kd'], 100),
        testPlayer('serge', ['Qh', 'Qd'], 100),
      ],
      {smallBlind: 1, bigBlind: 2, game: 0},
      Deck.fromCards(['2s', '3s', '6d', '9h', '4c'])
    );
    const game = test.game;
    const [pDavid, pJustin, pSerge] = test.profiles;

    await game.begin();

    expect(game.hand.players.length).to.equal(3);

    await game.processAction(pDavid.bet(5, true));
    await game.processAction(pJustin.fold());
    await game.processAction(pSerge.call());

    expect(game.hand.state).to.equal(GameState.POSTFLOP);

    await game.processAction(pSerge.check());
    await game.processAction(pDavid.bet(5));
    await game.processAction(pSerge.call());

    expect(game.hand.state).to.equal(GameState.POSTTURN);

    await game.processAction(pSerge.check());
    await game.processAction(pDavid.bet(10));
    await game.processAction(pSerge.call());

    expect(game.hand.state).to.equal(GameState.POSTRIVER);

    await game.processAction(pSerge.check());
    await game.processAction(pDavid.check());

    expect(game.hand.state).to.equal(GameState.SHOWDOWN);
    // david wins!

    expect(game.hand.players[0].stack).to.equal(121); // +21
    expect(game.hand.players[1].stack).to.equal(99); // -1
    expect(game.hand.players[2].stack).to.equal(80); // -20
  });
});
