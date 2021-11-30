import {EventNames, ActionNames} from './api/shared/consts';
import {IBaseEvent, IControlEvent, IHandStateModel} from './api/shared/schema';
import {Profile, IHand, IEvent, Event, IPlayer} from './api/schema';
import {IEventData} from './api/shared/schema';
import {Card} from './api/deck';

const SERVER_VERSION = 0.1;

async function stateSnapshotFromHand(hand: IHand): Promise<IHandStateModel> {
  const usernamesLoader = Promise.all(
    hand.players.map(async (player) => {
      if (player.profile) {
        return await Profile.findById(player.profile);
      } else {
        return null;
      }
    })
  );
  const lastActionsLoader = Promise.all(
    hand.players.map(async (player) => {
      if (player.lastAction) {
        return await Event.findById(player.lastAction);
      } else {
        return null;
      }
    })
  );

  const [usernames, lastActions] = await Promise.all([usernamesLoader, lastActionsLoader]);

  return {
    players: hand.players.map((player) => {
      return {
        profile: {
          id: player.profile?.valueOf().toString(),
          seat: player.seat,
          username: usernames[player.seat]?.username
        },
        stackSize: player.stack,
        folded: player.folded,
        inHand: player.inHand,
        activeBet: player.activeBet,
        lastAction: JSON.stringify(lastActions[player.seat])
      }
    }), // the players in each seat (.length == 9)
    communityCards: hand.communityCards,
    pots: hand.pots.map((pot) => {
      return {
        size: pot.size,
        participants: pot.participants.map((par) => par.valueOf().toString()),
        winners: pot.winners ? pot.winners.map((winner) => winner.valueOf().toString()) : null
      }
    }),
    nextSpeaker: hand.nextSpeaker, // the next speaker expected (or -1, if hand over.)
    state: hand.state, // hand state
  }
}



/**
 * Use on the server side to create + issue commands.
 */
export class Events {
  origin: string
  audience: string

  constructor(audience: string, origin: string) {
    this.origin = origin;
    this.audience = audience;
  }


  static fromPlayer(player: IPlayer): Events {
    return new Events('all', player.profile.valueOf().toString());
  }

  static forPlayerOnly(player: IPlayer): Events {
    return new Events(player.profile.valueOf().toString(), 'server');
  }

  static controlEventForPlayerWithId(playerId: string): Events {
    return new Events(playerId, 'server');
  }

  static forAll(): Events {
    return new Events('all', 'server');
  }

  static fromString(json: string): IBaseEvent {
    const contents = JSON.parse(json);
    return contents as IBaseEvent;
  }

  fromData(name: string, data: IEventData | null): IEvent {
    return new Event({
      origin: this.origin,
      audience: this.audience,
      name,
      data,
    });
  }

  handBegin(): IEvent {
    return this.fromData(EventNames.HAND_BEGIN, null);
  }

  requestAction(target: string, validUntil: Date): IEvent{
    return this.fromData(EventNames.REQUEST_ACTION, null);
  }

  async state(hand: IHand): Promise<IEvent> {
    return this.fromData(EventNames.HAND_STATE, {
      bet_data: null,
      state_data: await stateSnapshotFromHand(hand)
    });
  }

  deal(cards: Card[]): IEvent{
    return this.fromData(EventNames.DEAL, {
      card_data: {
        cards
      }
    });
  }

  call(amount: number, isAllIn: boolean): IEvent{
    return this.fromData(ActionNames.CALL, {
      bet_data: {
        bet_amount: amount,
        is_all_in: isAllIn
      },
      state_data: null
    });
  }

  check(): IEvent {
    return this.fromData(ActionNames.CHECK, null);
  }

  fold(): IEvent{
    return this.fromData(ActionNames.FOLD, null);
  }

  bet(amount: number, isAllIn: boolean = false): IEvent {
    return this.fromData(ActionNames.BET, {
      bet_data: {
        bet_amount: amount,
        is_all_in: isAllIn
      },
      state_data: null
    });
  }

  flop(flop: Card[]): IEvent{
    return this.fromData(EventNames.FLOP, null);
  }

  turn(turn: Card): IEvent{
    return this.fromData(EventNames.TURN, null);
  }

  river(river: Card): IEvent{
    return this.fromData(EventNames.RIVER, null);
  }

  handEnd(): IEvent{
    return this.fromData(EventNames.HAND_END, null);
  }

  invalidAuth(message: string): IControlEvent {
    return this.controlEvent(
      ActionNames.INVALID_AUTH, message
    );
  }

  leftTable(user: string): IControlEvent {
    return this.controlEvent(
      EventNames.LEAVE, user
    )
  }

  notPermitted(message: string): IControlEvent {
    return this.controlEvent(
      ActionNames.INVALID_PERMISSION, message
    );
  }

  welcome(message: string, isHost: boolean): IControlEvent {
    return this.controlEvent(
      ActionNames.WELCOME,
      message,
      {
        welcome_data: {
          is_host: isHost,
          server_version: SERVER_VERSION
        }
      }
    );
  }

  controlEvent(name: string, message: string, data: IEventData = null): IControlEvent {
    return {
      name,
      message,
      audience: this.audience,
      data
    };
  }
}
