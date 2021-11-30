import {Schema, Document, model as Model} from 'mongoose';
import mongoose from 'mongoose';
import {Card, Deck} from './deck';
import {GameState} from './shared/consts';
import {IBaseEvent, IEventData, IProfileModel, ITableConfig, IWelcomeData, ICardData, IHandStateModel} from './shared/schema';

export interface IProfile extends IProfileModel, Document {}

export const Profile = Model<IProfile>('Profile', new Schema({
  startingStack: {type: Schema.Types.Number, default: 0},
  username: {type: Schema.Types.String, required: true}, /* the name of the user */
  email: {type: Schema.Types.String, required: true},
  pin: {type: Schema.Types.String, required: true},    /* the four number pin to rejoin */
  salt: {type: Schema.Types.String, required: true},
  token: {type: Schema.Types.String}, /* current auth */
  created: Schema.Types.Date,
  last_active: Schema.Types.Date, /* Last time the user did something.*/
  hands_played: {type: Schema.Types.Number, default: 0}
}));

export const BetData = new Schema({
  amount: Schema.Types.Number, /* the amount. */
  is_all_in: Schema.Types.Boolean, /* whether or not it's all in. */
}, {
  _id: false
});

export interface IPlayer {
  profile: mongoose.Types.ObjectId | null, /* objectId to a profile. */
  seat: number,
  stack: number,
  activePot: number,
  activeBet: number,
  cards: string[],
  hasAction: boolean,
  lastAction: mongoose.Types.ObjectId,
  folded: boolean,
  inHand: boolean
}

export const Player = new Schema({
  profile: {type: Schema.Types.ObjectId, ref: 'Profile'},
  seat: Schema.Types.Number,
  stack: Schema.Types.Number,
  cards: [Schema.Types.String],
  activePot: {type: Schema.Types.Number, default: 0},
  activeBet: {type: Schema.Types.Number, default: 0},
  hasAction: Schema.Types.Boolean,
  lastAction: {type: Schema.Types.ObjectId, ref: 'Event'},
  inHand: {type: Schema.Types.Boolean, default: false},
  folded: {type: Schema.Types.Boolean, default: false}
}, {
  _id: false
});

export const EventBetData = new Schema({
  bet_amount: Schema.Types.Number,
  is_all_in: Schema.Types.Boolean
}, {
  _id: false
});


export const EventMinimalProfileModel = new Schema({
  id: Schema.Types.String,
  seat: Schema.Types.Number,
  username: Schema.Types.String
}, {
  _id: false
})

export const EventHandStatePlayerModel = new Schema({
  profile: EventMinimalProfileModel,
  stackSize: Schema.Types.Number,
  folded: Schema.Types.Number,
  inHand: Schema.Types.Number,
  activeBet: Schema.Types.Number,
  lastAction: Schema.Types.String
}, {
  _id: false
});

export const EventPotModel = new Schema({
  size: Schema.Types.Number,
  participants: [Schema.Types.String],
  winners: [Schema.Types.String]
}, {
  _id: false
});

export const EventHandStateData = new Schema<IHandStateModel>({
  players: [EventHandStatePlayerModel], // the players in each seat (.length == 9)
  communityCards: [Schema.Types.String],
  pots: [EventPotModel],
  nextSpeaker: Schema.Types.Number, // the next speaker expected (or -1, if hand over.)
  state: Schema.Types.Number, // hand state
}, {
  _id: false
});

export const EventCardData = new Schema<ICardData>({
  cards: [Schema.Types.String]
}, {
  _id: false
});

export const EventWelcomeData = new Schema<IWelcomeData>({
  is_host: Schema.Types.Boolean,
  server_version: Schema.Types.Number
}, {
  _id: false
});

export const EventData = new Schema<IEventData>({
  bet_data: EventBetData,
  state_data: EventHandStateData,
  card_data: EventCardData,
  welcome_data: EventWelcomeData
}, {
  _id: false
});

export interface IEvent extends Document, IBaseEvent {
  hand: mongoose.Types.ObjectId | null, /* the id of the associated hand. */
  origin: mongoose.Types.ObjectId, /* the supposed origin of the message. */
}

export const Event = Model<IEvent>('Event', new Schema({
  name: Schema.Types.String, /* name of the event */
  audience: Schema.Types.String,
  hand: {type: Schema.Types.ObjectId, ref: 'Hand'},
  seq_id: Schema.Types.Number, /* the sequential ordering of this event. */
  origin: {type: Schema.Types.ObjectId, ref: 'Profile'}, /* the id of the player submitting this. */
  data: EventData,
}));

export interface IPot {
  size: number, // size of the pot.
  participants: mongoose.Types.ObjectId[], // the players (by profile id) participating in the hand.
  requires_runout: boolean,
  winners: mongoose.Types.ObjectId[]
}

const Pot = new Schema({
  number: Schema.Types.Number, /* which # pot is this? 1st / 2nd / etc. */
  size: Schema.Types.Number,
  participants: [{type: Schema.Types.ObjectId, ref: 'Player'}],
  requires_runout: {type: Schema.Types.Boolean, default: false},
  winners: [{type: Schema.Types.ObjectId, ref: 'Player'}]
});

export interface IHand extends Document {
  creationTime: Date,
  event_counter: number, /* the seq_id of the next event to be created. */
  events: mongoose.Types.ObjectId[],
  table: string,
  players: IPlayer[], /* the players in each seat. */
  button: number, /* table seat-position of the button. */
  state: number, /* current state of the hand. */
  pots: IPot[], /* pots in play in this hand. */
  deck: Deck | null, /* string serialization of the deck. */
  communityCards: Card[], /* community cards evealed. */
  nextSpeaker: number, /* the next person to act, if the game is not over. */
}

export const Hand = Model<IHand>('Hand', new Schema({
  creationTime: Schema.Types.Date,
  event_counter: {type: Schema.Types.Number, default: 0},
  events: {type: [{type: Schema.Types.ObjectId, ref: 'Event'}], default: []},
  table: {type: Schema.Types.ObjectId, ref: 'Table', required: true},
  activeBet: {type: Schema.Types.Number, default: 0},
  players: [Player],

  button: Schema.Types.Number, /* table seat-position of the button. */
  state: {type: Schema.Types.Number, default: GameState.UNINITIALIZED}, /* current state of the hand. */
  pots: [Pot], /* pots in play in this hand. */
  deck: {
      type: Schema.Types.String,
      required: true,
      get: (val: any) => val ? Deck.fromSerialization(val) : null,
      set: (deck: Deck) => deck.serialize()
  }, /* string serialization of the deck. */
  communityCards: [Schema.Types.String], /* community cards evealed. */
  nextSpeaker: Schema.Types.Number, /* the next person to act, if the game is not over. */
}, { toJSON: { getters: false /* disable because of the custom deck getter */} }));

const TableConfig = new Schema({
  smallBlind: Schema.Types.Number,
  bigBlind: Schema.Types.Number,
  game: Schema.Types.Number
});

export interface ITable extends Document {
  host: {type: Schema.Types.ObjectId, ref: 'Profile'},
  inviteCode: string,
  seats: Schema.Types.ObjectId[],
  hand_ids: Schema.Types.ObjectId[],
  currentHand: Schema.Types.ObjectId,
  config: ITableConfig
}

export const Table = Model<ITable>('Table', new Schema({
  host: {type: Schema.Types.ObjectId, ref: 'Profile'},
  inviteCode: Schema.Types.String,
  seats: [{type: Schema.Types.ObjectId, ref: 'Profile'}], /* Array of player ids. */
  hand_ids: [{type: Schema.Types.ObjectId, ref: 'Hand'}], /* the hands played here. */
  config: TableConfig,
  currentHand: {type: Schema.Types.ObjectId, ref: 'Hand'}
}))
