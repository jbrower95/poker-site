import {Hand as PokerUtil} from 'pokersolver';
import {Deck} from './deck';
import {Events} from '../events';
import {Actions} from '../actions';
import {GameState, ActionNames} from './shared/consts';
import {ITable, IHand, IEvent, IPlayer} from './schema';
import {IAction} from './shared/schema';
import {Table,  Hand, Event,  Profile} from './schema';
import {isValidRaise} from './shared/util';

export class Game {

  table: ITable
  hand: IHand
  verbose: boolean
  queuedEvents: IEvent[]

  constructor(table: ITable, hand: IHand, verbose: boolean = true) {
    this.table = table;
    this.hand = hand;
    this.verbose = verbose;
    this.queuedEvents = [];
  }

  log(message: string) {
    if (this.verbose) {
      console.log(message);
    }
  }

  static async lastHandPlayedAtTable(table: ITable): Promise<IHand | null> {
    /* query for hands that took place at this table, sorted by creation time. */
    return await Hand
        .findOne({'table': table.id})
        .sort({creationTime: 'ascending'})
        .exec();
  }

  static async newHand(table: ITable): Promise<Game> {
    let buttonPosition = 0;
    const lastHand = Game.lastHandPlayedAtTable(table);
    if (lastHand) {
      // @todo [correctness] Need to skip anyone sitting out.
      // @todo [correctness] Need to technically lock `table` while assiging button.
      buttonPosition = (buttonPosition + 1) % (table.seats.length);
    } else {
      // assign a random button.
      buttonPosition = Math.floor(Math.random() * table.seats.length);
    }

    const players: IPlayer[] = await Promise.all(table.seats.map(async (id: any, idx: number) => {
        if (id) {
          // this particular player.
          const profile = await Profile.findById(id);
          let startingStack = profile.startingStack;
          const inHand = startingStack > table.config.bigBlind;

          if (inHand) {
             // 'move' all chips into this hand.
            profile.startingStack = 0;
            profile.hands_played = profile.hands_played + 1;
            await profile.save();
          } else {
            startingStack = 0;
          }

          return {
            profile: id,
            seat: idx,
            stack: startingStack,
            activePot: 0,
            activeBet: 0,
            cards: null,
            hasAction: false,
            lastAction: null,
            folded: false,
            inHand
          }
        } else {
          // empty seat.
          return {
            profile: null,
            seat: idx,
            stack: 0,
            activePot: 0,
            activeBet: 0,
            cards: null,
            hasAction: false,
            lastAction: null,
            folded: false,
            inHand: false
          }
        }
    }));

    /* construct a new hand. */
    const hand = new Hand({
      table,
      button: buttonPosition,
      players,
      deck: Deck.newDeck().shuffle()
    })

    return new Game(
      table,
      hand
    );
  }

  static async fromHandId(id: any): Promise<Game> {
    // load this hand.
    const hand = await Hand.findById(id);
    if (hand == null) {
      throw new Error(`Failed to find hand with id: ${id}.`);
    }

    // load the associated table.
    const table = await Table.findById(hand.table);
    return new Game(table, hand);
  }

  isRoundOver(): boolean {
    // round is over if hasAction is entirely FALSE.
    return this.isGameOver() || this.hand.players.map((player) => !player.hasAction).reduce(
      (accum, val) => accum && val,
      true
    );
  }

  isGameOver(): boolean {
    const players = this.hand.players.filter((p) => p.inHand);
    if (players.length > 1) {
      return false;
    }

    if (players.length === 0) {
      return true;
    }

    // if there's only one player left in the hand, and he doesn't have action,
    // the game is over.
    const player = players[0];
    return !player.hasAction || (player.activeBet >= this.getActiveBet());
  }

  dealCards(amount: number): string[] {
    const cards = [];
    let [card, deck] = [null, this.hand.deck];
    for (let i = 0; i < amount; i++) {
      [card, deck] = deck.deal();
      cards.push(card);
    }
    this.hand.deck = deck; // update model.
    return cards;
  }

  deal(amount: number): void {
    // deal %amount% community cards.
    const cards = this.dealCards(amount);
    this.hand.communityCards = this.hand.communityCards.concat(cards);
  }

  async showDown(): Promise<void> {
    this.hand.state = GameState.SHOWDOWN;

    const potsAwarded = {};

    for (let i = 0; i < this.hand.pots.length; i++) {

      const pot = this.hand.pots[i];
      potsAwarded[0] = [];

      // these are the seat ids of the participants.
      const participants = pot.participants;

      // load all of the pot participants.
      const profiles = await Promise.all(participants.map(async (participant) => {
        return await Profile.findById(participant);
      }));

      const players: IPlayer[] = profiles.map(
        (profile) => {
          for (const player of this.hand.players) {
            if (player.profile?.valueOf().toString() === profile.id) {
              return player;
            }
          }

          throw new Error(`Couldnt find player with id: ${profile.id}`);
        }
      ).filter((player) => !player.folded);

      let winners = [];
      if (players.length > 1) {
        if (this.hand.communityCards.length < 5) {
          await this.runOutBoard();
        }

        const hands = players.map(
          (participant) => {
            return PokerUtil.solve(participant.cards.concat(this.hand.communityCards));
          }
        );

        // score the hands.
        winners = PokerUtil.winners(hands).map(
          (hand) => players.find((player) => player.profile?.valueOf().toString() === participants[hands.indexOf(hand)].valueOf().toString())
        );
      } else {
        // one person wins by default.
        winners = players;
      }
      potsAwarded[i] = winners.map((winner: IPlayer) => winner.profile.valueOf().toString());
      pot.winners = potsAwarded[i];
      const assignedPotAmount = pot.size / winners.length; // handling sidepots.

      for (const winner of winners) {
        if (!winner) {
          throw new Error('Couldnt find winner');
        }
        winner.stack = winner.stack + assignedPotAmount;
      }
    }

    // update all stacks.
    await Promise.all(this.hand.players.map(async (p) => {
      if (p.profile) {
        const profile = await Profile.findById(p.profile);
        profile.startingStack = p.stack;
        await profile.save();
      }
    }));

    this.enqueueEventForBroadcast(Events.forAll().handEnd());
  }

  async runOutBoard(): Promise<void> {
    const count = this.hand.communityCards.length;
    if (count < 5) {
      // @todo [correctness] Read total number of community cards from table config.
      this.deal(5 - count);
    }
  }

  async collectBetsAndCreateSidepots(): Promise<void> {
    const sortedPlayers =
      this.hand.players.filter(
        (p) => p.activeBet > 0
      ).sort(
        (a: IPlayer, b: IPlayer) => {
          return a.activeBet - b.activeBet;
        }
      );

    const potContributionAmount = {};
    for (let i = 0; i < this.hand.pots.length; i++) {
      potContributionAmount[i] = -1; // no cap in this pot.
    }

    for (let j = 0; j < sortedPlayers.length; j++) {
        const player = sortedPlayers[j];
        if (player.activeBet === 0) {
          continue;
        }
        const totalPlayerBet = player.activeBet;
        // this player bet in this round.
        if (player.activeBet === player.stack && potContributionAmount[player.activePot] === -1) {
          // player is all in, and player's stack is determining the size of the pot.
          potContributionAmount[player.activePot] = player.stack;
          this.hand.pots[player.activePot].requires_runout = true;
        }

        let bet = player.activeBet;

        while (bet > 0) {
          const activePot = player.activePot;
          const pot = this.hand.pots[activePot];

          if (!pot) {
            const participants = sortedPlayers.map(
              (p) => p.profile
            ).slice(j);
            if (participants.length === 1) {
              // this is an uncontested pot.
              break;
            }
            this.hand.pots[activePot] = {
              size: 0,
              participants,
              requires_runout: false,
              winners: []
            };
            potContributionAmount[activePot] = -1; // no limit.
          }

          const contributionAmount = potContributionAmount[activePot];
          if (contributionAmount === -1) {
            // there is no sidepot to this pot.
            this.hand.pots[activePot].size += bet;
            bet = 0;
          } else {
            // contribute only the basic amount to this pot.
            this.hand.pots[activePot].size += contributionAmount;
            bet = bet - contributionAmount;
            player.activePot = player.activePot + 1;
          }
        }

        player.stack = player.stack - totalPlayerBet;
        player.activeBet = 0;
        // see if this player still has chips.
        player.lastAction = null;
    }
  }

  async next(): Promise<void> {
    if (this.isRoundOver()) {
      // collect bets
      await this.collectBetsAndCreateSidepots();

      // first, sort all players by their bet sizes.
      if (this.isGameOver()) {
        await this.showDown();
        return;
      }

      // reset all players.
      this.hand.players.forEach(player => {
        player.activeBet = 0;
        player.hasAction = player.inHand && (player.stack > 0) && !player.folded;
        player.lastAction = null;
      });

      // Advance the state of the game.
      switch (this.hand.state) {
        case GameState.PREFLOP:
          // deal flop.
          this.deal(3);
          this.hand.state = GameState.POSTFLOP;
          break;
        case GameState.POSTFLOP:
          // deal turn.
          this.deal(1)
          this.hand.state = GameState.POSTTURN;
          break;
        case GameState.POSTTURN:
          // deal river.
          this.deal(1)
          this.hand.state = GameState.POSTRIVER;
          break;
        case GameState.POSTRIVER:
          // deal river.
          await this.showDown();
          return;
      }

      this.hand.nextSpeaker = 0;
      this.advanceAction();

      // @todo [feature] Implement Shot clocks (we need to actually enforce this by enqueing a job).
      const now = new Date();
      const validUntil = new Date(now.getTime() + (1000 * 60));

      this.enqueueEventForBroadcast(
        Events
          .forAll()
          .requestAction(
            this.hand.players[this.hand.nextSpeaker].profile.valueOf().toString(),
            validUntil
          )
      );
    } else {
      // move forward if the current person we were waiting for spoke.
      if (!this.hand.players[this.hand.nextSpeaker].hasAction) {
        this.advanceAction();
      }
    }
  }

  // Assumes the button is in the game.
  offsetFromButton(amt: number): number {
    const activePlayers = this.hand.players.filter((p) => p.inHand).length;
    if (amt > activePlayers) {
      throw new Error(`Requested button offset ${amt} greater than total number of active players ${activePlayers}`);
    }

    let amount = amt;
    for (let i = 1; i < this.hand.players.length + 1; i++) {
      const speaker = i % this.hand.players.length;
      const player = this.hand.players[speaker];
      if (player.inHand) {
        amount = amount - 1;
        if (amount === 0) {
          return speaker;
        }
      }
    }

    throw new Error('This shouldnt happen');
  }

  advanceAction() {
    for (let i = 1; i < this.hand.players.length + 1; i++) {
      const speaker = (this.hand.nextSpeaker + i) % this.hand.players.length;
      const player = this.hand.players[speaker];
      if (player.hasAction && !player.folded && player.inHand) {
        this.hand.nextSpeaker = speaker;
        return;
      }
    }

    throw new Error('No valid player to transition action to.');
  }


  async begin(): Promise<void> {
    if (this.hand.players.length < 2) {
      return; // can't start game.
    }

    this.enqueueEventForBroadcast(
      Events
        .forAll()
        .handBegin()
    );

    // advance from initialized to preflop state.
    this.hand.state = GameState.PREFLOP;

    // all players start with action, if they're in the hand.
    this.hand.players.forEach((player) => {
      player.hasAction = player.inHand;
    });

    this.hand.pots = [
      {size: 0, participants: this.hand.players.map((p) => p.profile).filter((p) => p), requires_runout: false, winners: []}
    ];

    // deal the cards.
    this.hand.players.forEach((player) => {
      if (player.inHand) {
        player.cards = this.dealCards(2);
        this.enqueueEventForBroadcast(
          Events
            .forPlayerOnly(player)
            .deal(player.cards)
        );
      }
    });

    // @todo [correctness] Allow people to sit out (i.e deal with posting)
    this.hand.nextSpeaker = 0;
    this.advanceAction();
    const small = this.hand.players[this.hand.nextSpeaker];
    this.advanceAction();
    const big = this.hand.players[this.hand.nextSpeaker];
    this.hand.nextSpeaker = 0; // reset action.

    const smallBlind =
      Actions
        .forPlayer(small, this.hand)
        .bet(this.table.config.smallBlind);

    const bigBlind =
      Actions
        .forPlayer(big, this.hand)
        .bet(this.table.config.bigBlind);

    this.hand.nextSpeaker = 1;

    // process the blinds.
    await this.processAction(smallBlind);
    await this.processAction(bigBlind);

    // allow big blind to speak again.
    big.hasAction = true;
    small.hasAction = true;

    // save everything so far, so that we have an id.
    await this.save();

    const handId = this.hand.id;
    if (!handId) {
      throw new Error('No hand id after saving.');
    }

    this.table.currentHand = handId;
    await this.table.save();
  }

  getActiveBet(): number {
    const bets =
      this.hand.players.filter(
        (player: IPlayer) => !player.folded
      ).map(
        (player) => player.activeBet
      );

    return Math.max(...bets);
  }

  /**
   * Sets the players bet to the amount specified.
   */
  async placeBet(seat: number, amount: number): Promise<void> {
    await Promise.all(this.hand.players.map(async (player: IPlayer, index: number) => {
      if (!player.inHand) {
        return;
      }
      if (index === seat) {
        player.activeBet = amount;
        player.hasAction = false;
        if (player.activeBet === player.stack) {
          player.inHand = false;
        }
        return;
      }

      if (player.folded) {
        // no need to update folded players.
        player.hasAction = false;
        return;
      }

      if (player.lastAction == null) {
        // if the player hasn't acted yet, they have action.
        player.hasAction = true;
        return;
      }

      if (player.activeBet === player.stack) {
        // the player is all in.
        player.hasAction = false;
        player.inHand = false;
        return;
      }

      if (player.activeBet > amount) {
        // your called amount is actually less than what others have bet.
        return;
      }

      const lastAction = await Event.findById(player.lastAction);

      switch (lastAction.name) {
        case ActionNames.CHECK: {
          player.hasAction = true;
          return;
        }
        case ActionNames.CALL: {
          if (!lastAction.data.bet_data.is_all_in) {
            if (lastAction.data.bet_data.bet_amount < amount) {
              player.hasAction = true; // if you called a previous bet, you have action.
            }
          }
          break;
        }
        case ActionNames.BET: {
          // if this player last bet, you have action if this was a valid raise to that bet.
          player.hasAction = isValidRaise(lastAction.data.bet_data.bet_amount, amount);
          break;
        }
        default: {
          player.hasAction = false;
          break;
        }
      }
    }));
  }

  enqueueEventForBroadcast(event: IEvent): void {
    this.queuedEvents.push(event);
  }

  async processAction(action: IAction): Promise<void> {
      try {
      const origin = action.origin; // the player who sent the event.
      const nextSpeaker = this.hand.players[this.hand.nextSpeaker];
      if (nextSpeaker.profile.valueOf().toString() !== origin) {
        // this is not the correct person to listen to.
        // reject the event.
        const profiles = await Promise.all([
          await Profile.findById(nextSpeaker.profile),
          await Profile.findById(origin)
        ]);

        throw new Error(`User '${profiles[1].username}' acted out of turn. (expected next speaker '${profiles[0].username}')`);
      }

      const activeBet = this.getActiveBet();
      let lastAction = null;

      switch (action.type) {
        case ActionNames.CHECK: {
          if (activeBet > nextSpeaker.activeBet) {
            throw new Error(`Cannot check. Must call ${activeBet} (${nextSpeaker.activeBet} in play)`);
          }

          const check =
            Events
              .fromPlayer(nextSpeaker)
              .check();
          await check.save();
          this.enqueueEventForBroadcast(check);
          nextSpeaker.lastAction = check.id;
          nextSpeaker.hasAction = false;
          lastAction = check;
          break;
        }
        case ActionNames.CALL: {
          const calledAmount = Math.min(activeBet, nextSpeaker.stack);
          const isAllIn = (activeBet >= nextSpeaker.stack);
          const call =
            Events
              .fromPlayer(nextSpeaker)
              .call(calledAmount,  isAllIn/* is_all_in */);
          await call.save();
          this.enqueueEventForBroadcast(call);
          nextSpeaker.lastAction = call.id;
          nextSpeaker.hasAction = false;
          nextSpeaker.inHand = !isAllIn;
          nextSpeaker.activeBet = calledAmount;
          lastAction = call;
          break;
        }
        case ActionNames.FOLD: {
          const fold = Events.fromPlayer(
            nextSpeaker,
          ).fold();
          await fold.save();
          this.enqueueEventForBroadcast(fold);

          nextSpeaker.folded = true;
          nextSpeaker.hasAction = false;
          nextSpeaker.inHand = false;
          nextSpeaker.lastAction = fold.id;
          lastAction = fold;
          break;
        }
        case ActionNames.BET: {
          const isAllIn = action.data.amount === nextSpeaker.stack;
          const bet =
            Events
              .fromPlayer(nextSpeaker)
              .bet(action.data.amount, isAllIn);
          await bet.save();
          this.enqueueEventForBroadcast(bet);
          nextSpeaker.lastAction = bet.id;
          await this.placeBet(this.hand.nextSpeaker, action.data.amount);
          lastAction = bet;
          break;
        }
        case ActionNames.ALL_IN: {
          // what is the amount for?
          const amount = action.data.amount;

          const event =
            Events
              .fromPlayer(nextSpeaker)
              .bet(amount, true);
          await event.save();
          this.enqueueEventForBroadcast(event);

          nextSpeaker.lastAction = event.id;
          await this.placeBet(this.hand.nextSpeaker, amount);
          lastAction = event;
          break;
        }
        default:
          throw new Error('Unknown action type: ' + action.type);
      }
      await this.next();
    } catch (error) {
      this.log(`Invalid event processed:\n '${JSON.stringify(action)}'\n\n in state:\n${JSON.stringify(this.hand.toJSON())})`);
      throw error;
    }

    // enqueue a state update.
    this.enqueueEventForBroadcast(await Events.forAll().state(this.hand));
  }

  async save(): Promise<void> {
    // add queued events to the hand events.
    this.hand.events = this.hand.events.concat(this.queuedEvents.map(event => event.id));

    this.hand.markModified('players');
    this.hand.markModified('pots');

    await Promise.all([
      this.hand.save(),
      this.table.save()
    ]);
  }
}
