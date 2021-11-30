import { IBaseEvent, IControlEvent } from './api/shared/schema';
import { IHand, IEvent, IPlayer } from './api/schema';
import { IEventData } from './api/shared/schema';
import { Card } from './api/deck';
/**
 * Use on the server side to create + issue commands.
 */
export declare class Events {
    origin: string;
    audience: string;
    constructor(audience: string, origin: string);
    static fromPlayer(player: IPlayer): Events;
    static forPlayerOnly(player: IPlayer): Events;
    static controlEventForPlayerWithId(playerId: string): Events;
    static forAll(): Events;
    static fromString(json: string): IBaseEvent;
    fromData(name: string, data: IEventData | null): IEvent;
    handBegin(): IEvent;
    requestAction(target: string, validUntil: Date): IEvent;
    state(hand: IHand): Promise<IEvent>;
    deal(cards: Card[]): IEvent;
    call(amount: number, isAllIn: boolean): IEvent;
    check(): IEvent;
    fold(): IEvent;
    bet(amount: number, isAllIn?: boolean): IEvent;
    flop(flop: Card[]): IEvent;
    turn(turn: Card): IEvent;
    river(river: Card): IEvent;
    handEnd(): IEvent;
    invalidAuth(message: string): IControlEvent;
    leftTable(user: string): IControlEvent;
    notPermitted(message: string): IControlEvent;
    welcome(message: string, isHost: boolean): IControlEvent;
    controlEvent(name: string, message: string, data?: IEventData): IControlEvent;
}
