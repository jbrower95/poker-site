import {ActionNames} from './api/shared/consts';
import {IPlayer, IHand} from './api/schema';
import {IAction, IBetData} from './api/shared/schema';

export class Actions {

  player: IPlayer
  hand: IHand

  constructor(player: IPlayer, hand: IHand) {
    this.player = player;
    this.hand = hand;
  }

  static fromString(data: string): IAction {
    const contents = JSON.parse(data);
    return {
      ...contents,
    };
  }

  static forPlayer(player: IPlayer, hand: IHand): Actions {
    return new Actions(player, hand);
  }

  withBetData(name: string, data: IBetData | null): IAction {
    return {
      type: name,
      table: this.hand.table,
      data,    /* the four number pin to rejoin */
      origin: this.player.profile.valueOf().toString()
    };
  }

  check(): IAction {
    return this.withBetData(ActionNames.CHECK, null);
  }

  call(): IAction {
    return this.withBetData(ActionNames.CALL, null);
  }

  fold(): IAction {
    return this.withBetData(ActionNames.FOLD, null);
  }

  bet(amount: number, isAllIn: boolean = false): IAction {
    return this.withBetData(ActionNames.BET, {
      amount,
      is_all_in: isAllIn
    });
  }
}
