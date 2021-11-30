import React from 'react';
import { IHandStateModel, IPlayerModel, IBaseEvent } from '../shared/schema';

type TProps = {
  hand: IHandStateModel,
  player: IPlayerModel
}

export class Player extends React.Component<TProps> {

  render(): React.ReactNode {
    const player = this.props.player;

    const event = player.lastAction ? JSON.parse(player.lastAction) as IBaseEvent : null;

    return <div style={
        {
          backgroundColor: player.inHand ? undefined : 'rgba(0,0,0,.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          marginLeft: '20px',
          marginRight: '20px'
        }
      }>
      <p style={{fontWeight: 'bold'}}>{player.profile.username}</p>
      <p>{player.stackSize - player.activeBet}</p>
      <p>{event?.name} {event && event.data && event.data.bet_data && `(${event.data.bet_data.bet_amount})`}</p>
    </div>;
  }
}
