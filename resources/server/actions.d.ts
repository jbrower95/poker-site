import { IPlayer, IHand } from './api/schema';
import { IAction, IBetData } from './api/shared/schema';
export declare class Actions {
    player: IPlayer;
    hand: IHand;
    constructor(player: IPlayer, hand: IHand);
    static fromString(data: string): IAction;
    static forPlayer(player: IPlayer, hand: IHand): Actions;
    withBetData(name: string, data: IBetData | null): IAction;
    check(): IAction;
    call(): IAction;
    fold(): IAction;
    bet(amount: number, isAllIn?: boolean): IAction;
}
