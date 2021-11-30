import {expect} from 'chai';

import {Table, Hand} from '../../src/api/schema';
import {Deck} from '../../src/api/deck';
import {Game} from '../../src/api/game';
import {useInMemoryServer} from '../db';


describe('deck integration works.', () => {
  useInMemoryServer();
  it('dealing cards works', async () => {
    const table = new Table({
      players: []
    });
    await table.save();

    const hand = new Hand({
      table: table._id,
      deck: Deck.fromCards(['Ah', '2h', '3h', '4h'])
    });
    await hand.save();

    const game = new Game(table, hand);

    // tests that deck can deal in order.
    expect(game.dealCards(1)).to.deep.equal(['Ah']);
    expect(game.dealCards(1)).to.deep.equal(['2h']);
    expect(game.dealCards(1)).to.deep.equal(['3h']);

    await hand.save();

    // tests that deck is preserved across mongoose saves.
    const hand2 = await Hand.findById(hand._id);
    const game2 = new Game(table, hand2);

    expect(game2.dealCards(1)).to.deep.equal(['4h']);
  });
});
