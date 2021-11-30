import { ITable, IHand, IEvent } from './schema';
import { IAction } from './shared/schema';
export declare class Game {
    table: ITable;
    hand: IHand;
    verbose: boolean;
    queuedEvents: IEvent[];
    constructor(table: ITable, hand: IHand, verbose?: boolean);
    log(message: string): void;
    static lastHandPlayedAtTable(table: ITable): Promise<IHand | null>;
    static newHand(table: ITable): Promise<Game>;
    static fromHandId(id: any): Promise<Game>;
    isRoundOver(): boolean;
    isGameOver(): boolean;
    dealCards(amount: number): string[];
    deal(amount: number): void;
    showDown(): Promise<void>;
    runOutBoard(): Promise<void>;
    collectBetsAndCreateSidepots(): Promise<void>;
    next(): Promise<void>;
    offsetFromButton(amt: number): number;
    advanceAction(): void;
    begin(): Promise<void>;
    getActiveBet(): number;
    /**
     * Sets the players bet to the amount specified.
     */
    placeBet(seat: number, amount: number): Promise<void>;
    enqueueEventForBroadcast(event: IEvent): void;
    processAction(action: IAction): Promise<void>;
    save(): Promise<void>;
}
