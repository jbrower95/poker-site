"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Deck {
    constructor(index, cards) {
        this.index = index;
        this.cards = cards;
    }
    static fromCards(humanReadable) {
        const cards = humanReadable.map((c) => {
            return Deck.pokerSolverToBase64(c);
        }).join('');
        return new Deck(0, cards);
    }
    static base64toPokerSolver(card) {
        const which = Deck.BASE_64.indexOf(card);
        const suit = Math.floor(which / Deck.CARDS_PER_SUIT);
        const rank = which % Deck.CARDS_PER_SUIT;
        return Deck.ranks[rank] + Deck.suits[suit];
    }
    static pokerSolverToBase64(card) {
        // e.g Ah (ace of hearts).
        const rank = Deck.ranks.indexOf(card[0]);
        const suit = Deck.suits.indexOf(card[1]);
        return Deck.BASE_64[(suit * Deck.CARDS_PER_SUIT) + rank];
    }
    /**
     * Initialize a (shuffled) new deck in memory.
     */
    static newDeck() {
        const cards = Deck.BASE_64.slice(0, 52);
        return new Deck(0, cards);
    }
    static fromSerialization(data) {
        const obj = JSON.parse(data);
        return new Deck(obj.index, obj.cards);
    }
    serialize() {
        return JSON.stringify({
            cards: this.cards,
            index: this.index
        });
    }
    shuffle() {
        const cards = this.cards.split(""); // split string between each char
        for (let i = 0; i < cards.length; i++) {
            const targetIndex = Math.floor(Math.random() * cards.length);
            // swap targetIndex + i
            const temp = cards[i];
            cards[i] = cards[targetIndex];
            cards[targetIndex] = temp;
        }
        return new Deck(this.index, cards.join(""));
    }
    isEmpty() {
        return this.index >= this.cards.length;
    }
    deal() {
        if (this.isEmpty()) {
            throw new Error(`No cards remaining in deck. (index=${this.index}, len=${this.cards.length})`);
        }
        const card = Deck.base64toPokerSolver(this.cards[this.index]);
        return [card, new Deck(this.index + 1, this.cards)];
    }
}
exports.Deck = Deck;
Deck.BASE_64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
Deck.suits = ['c', 'h', 's', 'd'];
Deck.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
Deck.CARDS_PER_SUIT = 13; // 13 * 4 = 52 = total cards.
//# sourceMappingURL=deck.js.map