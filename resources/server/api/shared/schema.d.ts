export interface IBaseEvent {
    name: string;
    audience: string;
    data?: IEventData;
}
export interface IControlEvent extends IBaseEvent {
    message?: string;
}
export interface IPlayerModel {
    profile: IMinimalProfileModel;
    stackSize: number;
    folded: boolean;
    inHand: boolean;
    activeBet: number;
    lastAction: string;
}
export interface IPotModel {
    size: number;
    participants: string[];
    winners: string[] | null;
}
export interface IHandStateModel {
    players: IPlayerModel[];
    communityCards: string[];
    pots: IPotModel[];
    nextSpeaker: number;
    state: number;
}
export interface IMinimalProfileModel {
    id: string;
    seat: number;
    username: string;
}
export interface IProfileModel {
    startingStack: number;
    username: string;
    email: string;
    pin: string;
    salt: string;
    token: string;
    created: Date;
    last_active: Date;
    hands_played: number;
}
export interface IWireProfileModel extends IProfileModel {
    id: string;
}
export interface ITableModel {
    inviteCode: string;
    host: string;
    seats: string[];
    id: string;
    config: ITableConfig;
}
export interface IBetData {
    amount: number;
    is_all_in: boolean;
}
export interface IAction {
    type: string;
    data: IBetData | null;
    origin: string;
    table: string;
}
export interface IEventBetData {
    bet_amount: number;
    is_all_in: boolean;
}
export interface ICardData {
    cards: string[];
}
export interface IWelcomeData {
    is_host: boolean;
    server_version: number;
}
export interface IEventData {
    bet_data?: IEventBetData;
    state_data?: IHandStateModel;
    card_data?: ICardData;
    welcome_data?: IWelcomeData;
}
export interface ITableConfig {
    smallBlind: number;
    bigBlind: number;
    game: number;
}
