export declare type Card = string;
export declare class Deck {
    static BASE_64: string;
    static suits: string[];
    static ranks: string[];
    static CARDS_PER_SUIT: number;
    cards: string;
    index: number;
    constructor(index: number, cards: string);
    static fromCards(humanReadable: Card[]): Deck;
    static base64toPokerSolver(card: Card): Card;
    static pokerSolverToBase64(card: Card): Card;
    /**
     * Initialize a (shuffled) new deck in memory.
     */
    static newDeck(): Deck;
    static fromSerialization(data: string): Deck;
    serialize(): string;
    shuffle(): Deck;
    isEmpty(): boolean;
    deal(): [Card, Deck];
}
