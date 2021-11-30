import {expect} from 'chai';
import {TTableCreateResponse, TTableCreatePostData, TLoginPostData, TLoginResponse, TProfileCreatePostData, TProfileCreateResponse} from '../../src/api/shared/requests';
import axios from 'axios';
import {PORT} from '../db';
import {TEST_USER} from './constants';

const network = axios.create({baseURL: 'http://localhost:' + PORT})

describe('basic server functionality', () => {
  it('Registration + Login of new users works.', async () => {

    const USERNAME = 'jbrower95';
    const EMAIL = 'jbrower95@gmail.com';
    const PASSWORD = 'jay-plays-poker69';

    // try registering a user.
    const user : TProfileCreatePostData = {
      username: USERNAME,
      email: EMAIL,
      pin: PASSWORD
    };

    const response = await network.post<TProfileCreateResponse>(
      "/api/v1/profile/create",
      user,
      {headers: {'Content-Type': 'application/json'}}
    );

    expect(response.data.success, `Error: ${response.data.error}`).to.be.true;
    expect(response.data.error).to.be.undefined;
    expect(response.data.profile.username).to.equal(USERNAME);
    expect(response.data.profile.email).to.equal(EMAIL);
    expect(response.data.profile.token).to.not.be.null;

    // try to login now!
    const login: TLoginPostData = {
      username: USERNAME,
      password: PASSWORD
    };

    const loginResponse = await network.post<TLoginResponse>(
      "/api/v1/profile/login",
      login,
      {headers: {'Content-Type': 'application/json'}}
    );

    expect(loginResponse.data.success, `Error: ${loginResponse.data.error}`).to.be.true;
    expect(loginResponse.data.error).to.be.undefined;
    expect(loginResponse.data.profile.username).to.equal(USERNAME);
    expect(loginResponse.data.profile.email).to.equal(EMAIL);
    expect(loginResponse.data.profile.token).to.not.be.null;
  });

  it('Creating a new table works', async () => {
    const requestData: TTableCreatePostData = {
        config: {
          game: 0,
          smallBlind: 1,
          bigBlind: 2
        }
    };
    const tableResponse = await network.post<TTableCreateResponse>(
      "/api/v1/table/create",
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'user=' + encodeURIComponent(TEST_USER.token)
        },
        withCredentials: true,
      }
    );

    expect(tableResponse.data.success, `Error: ${tableResponse.data.error}`).to.be.true;
    expect(tableResponse.data.error).to.be.undefined;
    expect(tableResponse.data.table.id).to.not.be.null;
    expect(tableResponse.data.table.config).to.not.be.null;

    const receivedConfig = tableResponse.data.table.config;
    expect(receivedConfig.game).to.equal(0);
    expect(receivedConfig.smallBlind).to.equal(1);
    expect(receivedConfig.bigBlind).to.equal(2);
  });
});
