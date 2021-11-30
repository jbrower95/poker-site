

export function isValidRaise(originalBet: number, raiseTo: number): boolean {
  return raiseTo >= (originalBet * 2);
}
