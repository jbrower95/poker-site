import { Api, GameConnection } from "./Api";
import { WebsocketUtils } from './Utils';
import WebSocket from 'isomorphic-ws';
import {IBaseEvent, IWireProfileModel, IAction} from '../shared/schema';
import {IGameInformationResponse} from '../shared/requests';
import {NetworkApi} from './NetworkApi';
import { Actions } from "./Actions";
import querystring from 'querystring';


export class WebsocketGameConnection implements GameConnection {

  api: Api
  user: IWireProfileModel
  tableId: string
  ws: WebSocket
  _onEvent: ((event: IBaseEvent) => void) | null
  _onHostChange: ((isHost: boolean) => void) | null
  isHost: boolean

  constructor(
    api: Api,
    tableId: string
  ) {
    this.api = api;
    this.tableId = tableId;
    this.isHost = false;

    const user = this.api.getLoggedInProfile();
    if (!user) {
      throw new Error('Not logged in.');
    }
    this.user = user;
    const queryString = querystring.encode({user: user.id, token: user.token, table: this.tableId});
    const url = WebsocketUtils.websocketUrlByPath(NetworkApi.API_PREFIX_NO_LEADING_SLASH + 'stream?' + queryString);
    console.log(`Connecting to url: ${url}`);
    this.ws = new WebSocket(url);
    this._onEvent = null;
    this._onHostChange = null;
  }

  actions(): Actions {
    const user = this.api.getLoggedInProfile();
    if (!user) {
      throw new Error('Not logged in.');
    }

    return Actions.forPlayer(user, this.tableId);
  }

  connect(): Promise<void> {
    console.log('attempting to connect...');
    return new Promise((resolve, reject) => {
      // fwd declaration so that they can mutually reference eachother.
      let listenerOpen:  (() => void) | null = null;
      let listenerError: (() => void) | null = null;

      listenerOpen = () => {
        console.log('opened!');
        resolve();
        if (this.ws.onerror === listenerError) {
          this.ws.onerror = () => {};
        }
      }

      listenerError = () => {
        console.log('error!!');
        reject();
        if (this.ws.onopen === listenerOpen) {
          this.ws.onopen = () => {};
        }
      }

      this.ws.onopen = listenerOpen;
      this.ws.onerror = listenerError;
    });
  }

  getProfile(): IWireProfileModel | null {
    return this.api.getLoggedInProfile();
  }

  getTableId(): string {
    return this.tableId;
  }

  send(action: IAction): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(action));
    } else {
      console.error('Failed to send action, socket wasnt ready');
    }
  }

  refresh(): Promise<IGameInformationResponse> {
    throw new Error("Method not implemented.");
  }

  onHostChanged(callback: (isHost: boolean) => void) {
    this._onHostChange = callback;
  }

  onEvent(callback: (event: IBaseEvent) => void): void {
    // attach the listener.
    this.ws.onmessage = (event: WebSocket.MessageEvent) => {
      const data = JSON.parse(event.data.toString()) as IBaseEvent;
      const welcomeData = data.data?.welcome_data;
      if (welcomeData) {
        this.isHost = welcomeData.is_host;
        if (this._onHostChange) {
          this._onHostChange(this.isHost);
        }
      }
      if (this._onEvent) {
        this._onEvent(data as IBaseEvent);
      }
    };
    this._onEvent = callback;
  }

  close(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN)) {
      // close the socket.
      this.ws.close();
    }
  }
}
