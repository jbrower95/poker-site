import {ActionNames} from '../shared/consts';
import {IAction, IBetData, IWireProfileModel} from '../shared/schema';

export class Actions {

  player: IWireProfileModel
  table: string

  constructor(player: IWireProfileModel, table: string) {
    this.player = player;
    this.table = table;
  }

  static serialize(action: IAction) {
    return JSON.stringify(action);
  }

  static fromString(data: string): IAction {
    const contents = JSON.parse(data);
    return {
      ...contents,
    };
  }

  static forPlayer(player: IWireProfileModel, table: string): Actions {
    return new Actions(player, table);
  }

  withBetData(name: string, data: IBetData | null): IAction {
    return {
      type: name,
      table: this.table,
      data,    /* the four number pin to rejoin */
      origin: this.player.id
    };
  }

  welcome(): IAction {
    return this.withBetData(ActionNames.WELCOME, null);
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

  requestChips(amount: string): IAction {
    return this.withBetData(ActionNames.CHIPS, {amount: parseInt(amount, 10), is_all_in: false});
  }

  acceptChips(_requestId: string): IAction {
    // TODO(correctness): put in the id
    return this.withBetData(ActionNames.ACCEPT_CHIPS, null);
  }

  leave(): IAction {
    return this.withBetData(ActionNames.LEAVE, null);
  }

  bet(amount: number, isAllIn: boolean = false): IAction {
    return this.withBetData(ActionNames.BET, {
      amount,
      is_all_in: isAllIn
    });
  }

  startHand(): IAction {
    return this.withBetData(ActionNames.REQUEST_START_HAND, null);
  }
}
