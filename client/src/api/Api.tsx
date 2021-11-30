import {IWireProfileModel, IBaseEvent, ITableConfig, ITableModel, IAction, } from '../shared/schema';
import {IGameInformationResponse} from '../shared/requests';
import { Actions } from './Actions';

/**
 * All of the network-bound operations for the client.
 */
export interface Api {

  /**
   * A chance for the API class to restore itself from local storage.
   * All APIs should progressively write to local storage as they perform
   * modifications.
   */
  onMount(): void;

  /**
   * Log out current user + detroy session.
   */
  logout(): Promise<void>

  /**
   * Open a RTC WebSocket connection with a table.
   */
  connectToTable(tableId: string): Promise<GameConnection>

  /**
   * Is there a table connected?
   */
  isConnectedToTable(): boolean

  /**
   * If there is an active WebSocket table connection, disconnect.
   */
  disconnectFromTable(): void;

  /**
   * What table are we connected to rn?
   */
  getActiveTable(): GameConnection | null

  /**
   * Creates a new table.
   */
  createTable(config: ITableConfig): Promise<ITableModel>

  /**
   * Create a new profile on the website.
   */
  createProfile(
    username: string,
    email: string,
    password: string,
  ): Promise<IWireProfileModel>;

  /**
   * Returns true if the user is authenticated.
   */
  isLoggedIn(): boolean;

  /**
   * Returns a promise that resolves without exception if the user is logged in.
   * Throws an exc. if user failed to login (i.e on error)
   */
  logIn(username: string, password: string): Promise<IWireProfileModel>;

  /**
   * Specify a callback to fire when login status changes.
   */
  onLoginChanged(callback: (profile: IWireProfileModel | null) => void): void;

  /**
   * Returns the logged in profile, if one exists.
   */
  getLoggedInProfile(): IWireProfileModel | null;
}


export interface GameConnection {

  /**
   * Whether or not the current user is the host of the session.
   */
  isHost: boolean;

  /**
   * Specify a callback to run when whether you're the host changes.
   */
  onHostChanged(callback: (isHost: boolean) => void): void;

  /**
   * The actions convenience object for issuing commands.
   */
  actions(): Actions;

  /**
   * Return the profile associated with this game connection.
   */
  getProfile(): IWireProfileModel | null;

  /**
   * Returns the id of the table you're connected to.
   */
  getTableId(): string;

  /**
   * Submit an action to the connection.
   */
  send(action: IAction): void;

  /**
   * Close the current active connection (if one exists.)
   */
  close(): void;

  /**
   * Connect to the game service.
   */
  connect(): Promise<void>

  /**
   * Request full game information.
   */
  refresh(): Promise<IGameInformationResponse>

  // PRAGMA: event emitter methods.

  /**
   * Add an event listener.
   *
   * Returns the id of the listener.
   */
  onEvent(callback: (event: IBaseEvent) => void) : void;
}
