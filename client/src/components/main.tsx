import React from 'react';
import {Api} from '../api/Api';
import * as CSS from 'csstype';
import {IProfileModel, ITableModel} from '../shared/schema';

import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import {Table} from './Table';


const PAGE_HOME = 0;
const PAGE_GAME = 1;

const STATE_HOME = 0;
const STATE_HOST_GAME = 1;
const STATE_JOIN_GAME = 2;
const STATE_LOGIN = 3;

type TProps = {
  api: Api,
};

type TState = {
  page: number,
  user: IProfileModel | null,
  action: number,
  username: string,
  password: string,
  inviteCode: string,
  table: string | null
};

const topbar: CSS.Properties<string | number> = {
  width: '100%',
  flexDirection: 'row',
  marginTop: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around'
};

const barItem: CSS.Properties = {
  textDecoration: 'underline',
  marginLeft: '48px',
  marginRight: '48px',
  padding: 'none'
};



export class Main extends React.Component<TProps, TState> {

  constructor(props: TProps) {
    super(props);
    this.state = {
      page: PAGE_HOME,
      user: this.props.api.getLoggedInProfile(),
      action: STATE_HOME,
      inviteCode: '',
      table: null,
      username: '',
      password: ''
    };
    this.props.api.onLoginChanged((_profile) => {
      console.log('login status changed.');
      this.setStateFromApi();
    });
  }

  render(): React.ReactNode {
    switch (this.state.page) {
      case PAGE_HOME:
        return this.renderHomepage();
      case PAGE_GAME:
        return this.renderGame();
    }
  }

  renderLoginButton(): React.ReactNode {
    if (this.state.user) {
      return <Alert.Link style={barItem}>{this.state.user.username}</Alert.Link>;
    } else {
      return <Alert.Link style={barItem} onClick={() => {
        this.setState({action: STATE_LOGIN})
      }}>login</Alert.Link>;
    }
  }

  isLoggedIn(): boolean {
    return this.state.user !== null;
  }

  renderTopBar(): React.ReactNode {
    return <div style={topbar}>
      {this.renderLoginButton()}
      <Alert.Link>stats</Alert.Link>
      <Alert.Link>support</Alert.Link>
      <Alert.Link>about</Alert.Link>
      {this.state.user ? <Alert.Link onClick={() => {this.props.api.logout().then(() => {
        this.setState({user: null})
      })}}>logout</Alert.Link> : null}
    </div>;
  }

  renderNewGameMaker(): React.ReactNode {
    return <div style={{marginTop: '64px', display: 'flex', justifyContent: 'center', flexGrow: 1}}>
      <Card style={{ width: 'auto', padding: '18px'}}>
        <Card.Title>Texas Hold'em</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">2 hole cards, 5 community. Fast paced.</Card.Subtitle>
        <div style={{width: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'start'}}>
          <div style={{flexDirection: 'row'}}>
          <Button
            variant="primary"
            onClick={() => {
              this.props.api.createTable({game: 0, smallBlind: 1, bigBlind: 2}).then((table: ITableModel) => {
                console.log(`Created table '${table.inviteCode}'.`);
                this.setState({table: table.inviteCode, action: STATE_HOST_GAME});
              }).catch((error: any) => {
                alert('Failed: ' + error);
              });
            }}
            style={{width: '180px', marginRight: '6px'}}>Host Game</Button>
          <OverlayTrigger
              placement="right"
              delay={{ show: 250, hide: 400 }}
              overlay={<Tooltip id={'tooltip'}>This site is in beta! Please report any bugs.</Tooltip>}
            >
          <Badge pill={true} variant="warning" style={{display: 'inline'}}>Warning!</Badge>
          </OverlayTrigger>
          </div>
          <Button
            onClick={() => {
              this.setState({action: STATE_JOIN_GAME});
            }}
            variant="primary"
            style={{width: '180px', marginTop: "12px"}}>Join Game</Button>
          <Button disabled={true} variant="primary" style={{width: '180px', marginTop: "12px"}}>Matchmaking</Button>
          </div>
        </Card>
      </div>;
  }

  renderMainContent(): React.ReactNode {
    if (this.isLoggedIn()) {
      const table = this.state.table;
      if (!table) {
        return this.renderNewGameMaker();
      } else {
        return this.renderSelectedTable(table);
      }
    } else {
      return null;
    }
  }

  renderSelectedTable(table: string): React.ReactNode {
    return <div style={{display: 'flex', flexGrow: 1}}>
        <Table
          api={this.props.api}
          inviteCode={table}
          onLeaveTable={() => {
            this.props.api.disconnectFromTable();
            this.setState({table: null});
          }}
          />
          </div>;
  }

  renderHomepage(): React.ReactNode {
    return <div>
      {this.renderTopBar()}
      {this.renderMainContent()}
      {this.renderLoginModal()}
      {this.renderJoinModal()}
    </div>;
  }

  renderJoinModal(): React.ReactNode {
    const close = () => {this.setState({action: STATE_HOME})};

    return <Modal show={this.state.action === STATE_JOIN_GAME} onHide={
      () => {this.setState({action: STATE_HOME})}
    }>
          <Modal.Header closeButton={true}>
            <Modal.Title>Join Game</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Form.Group controlId="formBasicEmail">
                <Form.Label>Invite Code</Form.Label>
                <input type="text" value={this.state.inviteCode} onChange={(e) => {this.setState({inviteCode: e.target.value})}} />
              </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" variant="primary" onClick={() => {
              this.setState({table: this.state.inviteCode, action: STATE_HOME});
            }}>
              Login
            </Button>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
          </Modal.Footer>
      </Modal>
  }

  renderLoginModal(): React.ReactNode {
    const close = () => {this.setState({action: STATE_HOME})};

    return <Modal show={this.state.action === STATE_LOGIN} onHide={
      () => {this.setState({action: STATE_HOME})}
    }>
          <Modal.Header closeButton={true}>
            <Modal.Title>Login</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Form.Group controlId="formBasicEmail">
                <Form.Label>Username</Form.Label>
                <input type="text" value={this.state.username} onChange={(e) => {this.setState({username: e.target.value})}} />
              </Form.Group>
              <Form.Group controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <input type="text" value={this.state.password} onChange={(e) => {this.setState({password: e.target.value})}} />
              </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" variant="primary" onClick={() => {
              this.props.api.logIn(this.state.username, this.state.password).then(() => {
                this.setState({
                  user: this.props.api.getLoggedInProfile(),
                  action: STATE_HOME
                });
              }).catch((err) => {
                alert(err);
              });
            }}>
              Login
            </Button>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
          </Modal.Footer>
      </Modal>
  }

  renderGame(): React.ReactNode {
    const table = this.state.table;
    if (!table) {
      return null;
    }
    return this.renderSelectedTable(table);
  }

  setStateFromApi() {
    const profile = this.props.api.getLoggedInProfile();
    console.log(`profile: ${JSON.stringify(profile)}`);
    this.setState({
      user: profile
    });
  }

  componentDidMount() {
    this.setStateFromApi();
    this.props.api.onMount();
  }
}
