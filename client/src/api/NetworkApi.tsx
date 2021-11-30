import { Api, GameConnection } from "./Api";
import { ITableModel, ITableConfig, IWireProfileModel } from '../shared/schema';
import {
    TTableCreatePostData,
    TTableCreateResponse,
    TLoginPostData,
    TLoginResponse,
    TProfileCreatePostData,
    TProfileCreateResponse,
    TProfileResponse} from '../shared/requests';
import axios, { AxiosRequestConfig } from 'axios';
import { WebsocketGameConnection } from './WebsocketGameConnection';
import Cookies from 'js-cookie'


export class NetworkApi implements Api {

  static API_PREFIX: string = '/api/v1/';
  static API_PREFIX_NO_LEADING_SLASH: string = 'api/v1/';

  static network = axios.create({baseURL: NetworkApi.API_PREFIX})

  _loggedInProfile: IWireProfileModel | null = null;
  _ws: WebsocketGameConnection | null = null;
  _onLoginChangeCallback: ((profile: IWireProfileModel | null) => void) | null = null;

  constructor() {
    NetworkApi.network.interceptors.response.use((response) => {
      // Do something with response data
      return response;
    }, (error) => {
      if (error.response.status === 401) {
        // not authorized === logged out.
        this.logout();
      }
      // Do something with response error
      return Promise.reject(error);
    });
  }

  onLoginChanged(callback: (profile: IWireProfileModel | null) => void) {
    this._onLoginChangeCallback = callback;
  }

  isConnectedToTable(): boolean {
    return this._ws !== null;
  }

  getActiveTable(): GameConnection | null {
    return this._ws;
  }

  _requestOptions(): AxiosRequestConfig {
    return {
      headers: {'Content-Type': 'application/json'},
      withCredentials: true
    };
  }

  async createTable(config: ITableConfig): Promise<ITableModel> {
    const profile = this.getLoggedInProfile();
    if (!profile) {
      throw new Error('Not logged in.');
    }

    const data: TTableCreatePostData = {
      config
    };

    const response = await NetworkApi.network.post<TTableCreateResponse>(
      'table/create',
      data,
      this._requestOptions()
    );
    if (response.status !== 200 || !response.data.success) {
      throw new Error("Error creating table: " + response.data.error);
    }

    return response.data.table;
  }

  onMount(): void {
    // refresh the profile.
    const token = Cookies.get('user');
    if (token) {
      const profile = window.localStorage.getItem('user');
      if (profile) {
        this._setProfile(JSON.parse(profile))
      }
      this.refreshProfile().then((prof) => {
        this._setProfile(prof);
      }).catch((err) => {
        console.error(err);
      });
    }
  }

  disconnectFromTable() {
    if (this._ws) {
      this._ws.send(this._ws.actions().leave());
      this._ws.close();
      window.localStorage.removeItem('table');
    }
  }

  async connectToTable(tableId: string): Promise<GameConnection> {
    this._ws = new WebsocketGameConnection(this, tableId);
    await this._ws.connect();
    window.localStorage.setItem('table', tableId);
    return this._ws;
  }

  async createProfile(username: string, email: string, password: string): Promise<IWireProfileModel> {
    const data: TProfileCreatePostData = {
      username,
      email,
      pin: password
    };

    const response = await NetworkApi.network.post<TProfileCreateResponse>(
      'profile/create',
      data
    );

    if (response.status !== 200 || !response.data.success) {
      throw new Error("Error creating profile: " + response.data.error);
    }

    const profile = response.data.profile;
    if (!profile) {
      throw new Error('Malformed server response; expected profile.');
    }

    return profile;
  }

  isLoggedIn(): boolean {
    return this._loggedInProfile !== null;
  }

  async logIn(username: string, password: string): Promise<IWireProfileModel> {
    const data: TLoginPostData = {
      username,
      password
    };

    const response = await NetworkApi.network.post<TLoginResponse>(
      'profile/login',
      data
    );

    if (response.status !== 200 || !response.data.success) {
      throw new Error("Error logging in: " + response.data.error);
    }

    const profile = response.data.profile;
    if (!profile) {
      throw new Error("Failed to load logged in profile.");
    }

    this._setProfile(profile);
    return profile;
  }

  async refreshProfile(): Promise<IWireProfileModel> {
    const response = await NetworkApi.network.get<TProfileResponse>(
      'profile'
    );
    if (response.status !== 200 || !response.data.success) {
      throw new Error("Error logging in: " + response.data.error);
    }
    return response.data.profile;
  }

  async logout(): Promise<void> {
    this._setProfile(null);
    if (this._ws) {
      this._ws.close();
    }
    this._ws = null;
  }

  _setProfile(profile: IWireProfileModel | null) {
    this._loggedInProfile = profile;
    if (profile === null) {
      Cookies.remove('user');
      window.localStorage.removeItem('user');
    } else {
      Cookies.set('user', profile.token);
      window.localStorage.setItem('user', JSON.stringify(profile));
    }

    if (this._onLoginChangeCallback) {
      this._onLoginChangeCallback(profile);
    }
  }

  getLoggedInProfile(): IWireProfileModel | null {
    return this._loggedInProfile;
  }
}
