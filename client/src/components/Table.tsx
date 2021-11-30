import React from 'react';
import { Api } from '../api/Api';
import { IHandStateModel, ITableModel, IControlEvent, IPlayerModel } from '../shared/schema';
import Button from 'react-bootstrap/Button';
import table from './Table.png';
import { EventNames, GameState } from '../shared/consts';
import { Player } from './Player';

type TProps = {
  inviteCode: string, // invite code
  api: Api,
  onLeaveTable: () => void
}

const STATE_CONNECTING = 0;
const STATE_CONNECTED = 1;

let ACTIVE_NOTIF : Notification | null = null;

type TState = {
  state: number,
  model: ITableModel | null,
  cards: string[] | null,
  isHost: boolean,
  game: IHandStateModel | null,
}

export class Table extends React.Component<TProps, TState> {
  constructor(props: TProps) {
    super(props);
    const profile = this.props.api.getLoggedInProfile();
    if (!profile) {
      throw new Error('Not logged in.');
    }
    this.state = {state: STATE_CONNECTING, model: null, cards: null, game: null, isHost: false};
    this.props.api.connectToTable(this.props.inviteCode).then((connection) => {
      this.setState({state: STATE_CONNECTED, isHost: connection.isHost});
      connection.onHostChanged((isHost) => {
        this.setState({isHost})
      });
      connection.onEvent(this.onReceiveEvent.bind(this));
      setTimeout(() => {
        connection.send(connection.actions().welcome());
      }, 400);
      Notification.requestPermission();
    }).catch((exc) => {
      console.error(`Failed to connect to table: ${this.props.inviteCode}`);
      console.error(exc);
    });
  }

  onReceiveEvent(event: IControlEvent): void {
    switch (event.name) {
      case EventNames.DEAL:
        const cards = event.data?.card_data?.cards;
        if (cards) {
          this.setState({cards});
        } else {
          this.setState({cards: null});
        }
        break;
      case EventNames.HAND_STATE: {
        const handState = event.data?.state_data;
        if (handState) {
          const mainPot = handState.pots[0];
          if (mainPot.winners !== null && mainPot.winners.length > 0) {
            const me = this.getOwnProfile(handState);
            if (!me) {
              this.setState({game: null});
              return;
            }
            // check to see if you won.
            if (mainPot.winners.indexOf(me.profile.id) >= 0) {
              alert('You won!');
            } else {
              alert('You lost!')
            }
            // TODO: handle displaying sidepots.
          }
          this.setState({game: handState});
          setTimeout(() => {
            if (this.yourTurn()) {
              ACTIVE_NOTIF = new Notification("It's your turn!");
            } else if (ACTIVE_NOTIF) {
              ACTIVE_NOTIF.close();
              ACTIVE_NOTIF = null;
            }
          }, 200);
        }
        break;
      }
    }
  }

  getActiveBet(): number {
    if (!this.state.game) {
      return 0;
    }

    const activeBets = this.state.game.players.map((p) => p.activeBet || 0);
    return Math.max(...activeBets);
  }

  renderInviteCode(): React.ReactNode {
    return <p style={{display: 'inline', color: 'rgba(255,255,255,0.5)'}}>{this.props.inviteCode}</p>;
  }

  renderControlButtons(): React.ReactNode {
    const START_HAND_BUTTON = <Button variant="secondary" onClick={() => {
      const t = this.props.api.getActiveTable();
      if (t) {
        t.send(t.actions().startHand());
      }
    }}>
      Start Hand
    </Button>;

    const ACCEPT_CHIPS = <Button variant="secondary" onClick={() => {
      const t = this.props.api.getActiveTable();
      if (t) {
        t.send(t.actions().acceptChips('test'));
      }
    }}>
      Accept Chips
    </Button>;

    return <div style={{display: 'flex', flexDirection: 'row'}}>
      <Button variant="secondary" onClick={() => {
        if (this.props.onLeaveTable) {
          this.props.onLeaveTable();
        }
      }}>
        Leave Table
      </Button>
      {this.state.isHost && START_HAND_BUTTON}
      {this.state.isHost && ACCEPT_CHIPS}
    </div>;
  }

  getOwnProfile(model: IHandStateModel): IPlayerModel | null {
    const profile = this.props.api.getLoggedInProfile()?.id;
    if (!profile) {
      return null;
    }
    const p = model.players.find((player) => {
      return player.profile.id === profile
    });
    return p ?? null;
  }

  yourTurn(): boolean {
    if (!this.state.game) {
      return false;
    }

    if (this.state.game.state === GameState.SHOWDOWN) {
      return false;
    }

    const ns = this.state.game.players[this.state.game.nextSpeaker];

    const profile = this.props.api.getLoggedInProfile();
    if (!profile) {
      console.error('Not logged in.');
      return false;
    }

    return (ns.profile.id === profile.id);
  }

  renderGameButtons(): React.ReactNode {
    if (this.state.game) {
      // see if it's your turn.
      const ns = this.state.game.players[this.state.game.nextSpeaker];

      const profile = this.props.api.getLoggedInProfile();
      if (!profile) {
        console.error('Not logged in.');
        return null;
      }
      if (ns.profile.id === profile.id) {
        const yourBet = ns.activeBet;
        const CHECK = <Button variant="secondary" onClick={() => {
          const t = this.props.api.getActiveTable();
          if (t) {
            t.send(t.actions().check());
          }
        }}>
          Check
        </Button>;

        const CALL = <Button variant="secondary" onClick={() => {
          const t = this.props.api.getActiveTable();
          if (t) {
            t.send(t.actions().call());
          }
        }}>
          Call {this.getActiveBet() - yourBet}
        </Button>;

        const bet = this.getActiveBet();
        return <div
          style={{display: 'flex', flexDirection: 'row'}}>
          {(bet > 0 && yourBet < bet) ? CALL : null}
          {(bet === yourBet) ? CHECK : null}
          <Button variant="secondary" onClick={() => {
            const t = this.props.api.getActiveTable();
            if (t) {
              t.send(t.actions().fold());
            }
          }}>
            Fold
          </Button>
          <Button variant="secondary" onClick={() => {
            const t = this.props.api.getActiveTable();
            if (t) {
              t.send(t.actions().bet(15));
            }
          }}>
            Bet
          </Button>
        </div>;
      } else {
        return null;
      }
    }
  }

  renderState(): React.ReactNode {
    if (this.state.game) {
      const profile = this.getOwnProfile(this.state.game);
      if (profile) {
        const yourTurn = this.yourTurn();
        const bet = this.getActiveBet();

        let description = null;
        if (bet === 0 && yourTurn) {
          description = <p style={{fontStyle: 'italic'}}>The action checks to you.</p>;
        } else if (bet > 0 && yourTurn) {
          description = <p style={{fontStyle: 'italic'}}>Current bet: {bet}</p>;
        }
        const hasBet = profile.activeBet > 0;
        return <div>
          {description}
          {hasBet && <p>Your bet: {profile.activeBet}</p>}
        </div>;
      }
    }

    return null;
  }

  renderProfiles(): React.ReactNode {
    const hand = this.state.game;
    if (hand) {
      return <div style={{display: 'flex', flexDirection: 'row'}}>
        {hand.players.map((player) => {
          if (player.profile.id) {
            return <Player hand={hand} player={player} />
          } else {
            return null;
          }
        })}
      </div>
    }
    return null;
  }

  renderCards(): React.ReactNode {
    if (this.state.cards) {
      return <div style={{display: 'flex', flexDirection: 'row'}}>
        <p>{this.state.cards[0]}</p>
        <p>{this.state.cards[1]}</p>
      </div>;
    }

    return null;
  }

  render(): React.ReactNode {
    return <div style={{
      marginTop: '40px',
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
      width: '100%',
    }}>
      <div
        style={{
          flexGrow: 1,
          width: '800px',
          height: '450px',
          backgroundImage: `url(${table})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}>
        {this.renderInviteCode()}
        <div style={{display: 'flex', flexDirection: 'row'}}>
        {this.state.game?.communityCards.map((card) => {
          return <p key={card} style={{fontWeight: 'bold'}}>{card}</p>;
        })}
        </div>
      </div>
      {this.renderProfiles()}
      {this.renderState()}
      {this.renderCards()}
      {this.renderGameButtons()}
      {this.renderControlButtons()}
    </div>;
  }
}
