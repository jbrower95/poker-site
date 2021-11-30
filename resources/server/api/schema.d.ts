import { Schema, Document } from 'mongoose';
import mongoose from 'mongoose';
import { Card, Deck } from './deck';
import { IBaseEvent, IEventData, IProfileModel, ITableConfig, IWelcomeData, ICardData, IHandStateModel } from './shared/schema';
export interface IProfile extends IProfileModel, Document {
}
export declare const Profile: mongoose.Model<IProfile, {}>;
export declare const BetData: Schema<any>;
export interface IPlayer {
    profile: mongoose.Types.ObjectId | null;
    seat: number;
    stack: number;
    activePot: number;
    activeBet: number;
    cards: string[];
    hasAction: boolean;
    lastAction: mongoose.Types.ObjectId;
    folded: boolean;
    inHand: boolean;
}
export declare const Player: Schema<any>;
export declare const EventBetData: Schema<any>;
export declare const EventMinimalProfileModel: Schema<any>;
export declare const EventHandStatePlayerModel: Schema<any>;
export declare const EventPotModel: Schema<any>;
export declare const EventHandStateData: Schema<IHandStateModel>;
export declare const EventCardData: Schema<ICardData>;
export declare const EventWelcomeData: Schema<IWelcomeData>;
export declare const EventData: Schema<IEventData>;
export interface IEvent extends Document, IBaseEvent {
    hand: mongoose.Types.ObjectId | null;
    origin: mongoose.Types.ObjectId;
}
export declare const Event: mongoose.Model<IEvent, {}>;
export interface IPot {
    size: number;
    participants: mongoose.Types.ObjectId[];
    requires_runout: boolean;
    winners: mongoose.Types.ObjectId[];
}
export interface IHand extends Document {
    creationTime: Date;
    event_counter: number;
    events: mongoose.Types.ObjectId[];
    table: string;
    players: IPlayer[];
    button: number;
    state: number;
    pots: IPot[];
    deck: Deck | null;
    communityCards: Card[];
    nextSpeaker: number;
}
export declare const Hand: mongoose.Model<IHand, {}>;
export interface ITable extends Document {
    host: {
        type: Schema.Types.ObjectId;
        ref: 'Profile';
    };
    inviteCode: string;
    seats: Schema.Types.ObjectId[];
    hand_ids: Schema.Types.ObjectId[];
    currentHand: Schema.Types.ObjectId;
    config: ITableConfig;
}
export declare const Table: mongoose.Model<ITable, {}>;
