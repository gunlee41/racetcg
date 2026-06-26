import { PlayerState } from './Player';
import type { Card } from './CardData';
import { getDeckCards } from './CardData';

export type Phase = 'p1_turn' | 'p2_turn' | 'lap_transition' | 'zero_zone' | 'finished';

export interface GameSnapshot {
  phase: Phase;
  currentPlayer: number;
  p1: PlayerState;
  p2: PlayerState;
  turnCount: number;
  circuitLength: number;
  totalLaps: number;
  leader: 1 | 2 | null;
  winner: 1 | 2 | null;
  message: string;
  p1DeckCount: number;
  p2DeckCount: number;
  p1SpecialCard: Card | null;
  p2SpecialCard: Card | null;
}

const MAX_HAND = 7;
const CIRCUIT_LENGTH = 100;
const TOTAL_LAPS = 3;
const RPM_PASSIVE_PER_TURN = 8;
const SPEED_ENERGY_CONVERSION = 0.3;
const ZERO_ZONE_THRESHOLD = 0.8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SPECIAL_CARDS: Card[] = [
  {
    id: 'special_cruise',
    name: '크루즈 컨트롤',
    description: '엔진 과부하 없음, 최고속도 100 고정',
    type: 'boost',
    effect: { speedChange: 30, heatChange: 0, oppHeatChange: 0, shield: false, trapSpeedReduction: 0 },
  },
  {
    id: 'special_hyper',
    name: '하이퍼 부스트',
    description: '속도 +80, 열 상승 2배',
    type: 'nitro',
    effect: { speedChange: 80, heatChange: 30, oppHeatChange: 0, shield: false, trapSpeedReduction: 0 },
  },
  {
    id: 'special_barrier',
    name: '베리어',
    description: '모든 트랩 3턴간 차단',
    type: 'shield',
    effect: { speedChange: 0, heatChange: 0, oppHeatChange: 0, shield: true, trapSpeedReduction: 0 },
  },
];

export class GameManager {
  p1: PlayerState;
  p2: PlayerState;
  phase: Phase = 'p1_turn';
  currentPlayer: 1 | 2 = 1;
  turnCount: number = 0;
  circuitLength = CIRCUIT_LENGTH;
  totalLaps = TOTAL_LAPS;
  winner: 1 | 2 | null = null;
  message: string = '게임 시작! P1의 턴입니다.';
  lastCardPlayed: string | null = null;

  private p1Deck: Card[];
  private p2Deck: Card[];
  private p1SpecialCard: Card | null = null;
  private p2SpecialCard: Card | null = null;
  private leader: 1 | 2 | null = null;

  constructor() {
    this.p1 = new PlayerState('P1');
    this.p2 = new PlayerState('P2');
    this.p1Deck = shuffle(getDeckCards());
    this.p2Deck = shuffle(getDeckCards());
    this.drawInitialHands();
    this.updateLeader();
  }

  private drawInitialHands(): void {
    for (let i = 0; i < 5; i++) {
      const c1 = this.p1Deck.pop();
      const c2 = this.p2Deck.pop();
      if (c1) this.p1.hand.push(c1);
      if (c2) this.p2.hand.push(c2);
    }
  }

  private updateLeader(): void {
    const p1Progress = (this.p1.lap - 1) * this.circuitLength + this.p1.position;
    const p2Progress = (this.p2.lap - 1) * this.circuitLength + this.p2.position;
    if (p1Progress > p2Progress) this.leader = 1;
    else if (p2Progress > p1Progress) this.leader = 2;
    else this.leader = this.currentPlayer;
  }

  get leaderPlayer(): 1 | 2 | null {
    return this.leader;
  }

  get trailerPlayer(): 1 | 2 | null {
    if (this.leader === 1) return 2;
    if (this.leader === 2) return 1;
    return null;
  }

  getCurrentPlayerState(): PlayerState {
    return this.currentPlayer === 1 ? this.p1 : this.p2;
  }

  getOpponentState(): PlayerState {
    return this.currentPlayer === 1 ? this.p2 : this.p1;
  }

  getCurrentPlayerHand(): Card[] {
    return this.getCurrentPlayerState().hand;
  }

  snap(): GameSnapshot {
    return {
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      p1: this.p1,
      p2: this.p2,
      turnCount: this.turnCount,
      circuitLength: this.circuitLength,
      totalLaps: this.totalLaps,
      leader: this.leader,
      winner: this.winner,
      message: this.message,
      p1DeckCount: this.p1Deck.length,
      p2DeckCount: this.p2Deck.length,
      p1SpecialCard: this.p1SpecialCard,
      p2SpecialCard: this.p2SpecialCard,
    };
  }

  private drawCard(player: PlayerState, deck: Card[]): void {
    if (player.hand.length >= MAX_HAND) return;
    const card = deck.pop();
    if (card) player.hand.push(card);
  }

  canPlayCard(player: PlayerState, card: Card): boolean {
    return player.hand.includes(card) && !player.isOverheated;
  }

  playCard(cardIndex: number): void {
    const player = this.getCurrentPlayerState();
    const opponent = this.getOpponentState();
    const hand = player.hand;

    if (cardIndex < 0 || cardIndex >= hand.length) return;
    if (player.isOverheated) {
      this.message = '과열 상태! 턴을 넘겨야 합니다.';
      return;
    }

    const card = hand[cardIndex];
    const eff = card.effect;

    player.speed += eff.speedChange;
    player.rpm += eff.heatChange;
    opponent.rpm += eff.oppHeatChange;

    if (eff.shield) {
      player.hasShield = true;
    }

    if (card.type === 'trap') {
      if (opponent.hasShield) {
        this.message = `${opponent.name}의 실드가 트랩을 막았습니다!`;
        opponent.hasShield = false;
      } else {
        opponent.pendingTrapReduction = Math.max(opponent.pendingTrapReduction, eff.trapSpeedReduction);
        this.message = `${card.name} 발동! ${opponent.name}에게 ${eff.trapSpeedReduction} 감속 예약!`;
      }
    } else {
      this.message = `${card.name} 발동! 속도 ${eff.speedChange >= 0 ? '+' : ''}${eff.speedChange}`;
    }

    hand.splice(cardIndex, 1);
    this.lastCardPlayed = card.name;
  }

  accelerate(): void {
    const player = this.getCurrentPlayerState();
    if (player.isOverheated) {
      this.message = '과열 상태! 턴을 넘겨주세요.';
      return;
    }
    player.speed += 5;
    player.rpm += RPM_PASSIVE_PER_TURN;
    this.message = `가속! 현재 속도: ${player.speed}, 열: ${player.rpm}`;
  }

  passTurn(): void {
    const player = this.getCurrentPlayerState();

    if (player.isOverheated) {
      player.takeOverheatPenalty();
      this.message = `${player.name} 과열 패널티! 속도 -40, 열 30으로 하락`;
    }

    const speedBonus = Math.floor(player.speed * SPEED_ENERGY_CONVERSION);
    player.position += Math.floor(player.speed / 2) + speedBonus;

    if (player.pendingTrapReduction > 0) {
      player.speed = Math.max(0, player.speed - player.pendingTrapReduction);
      this.message += ` | 트랙 피해! 속도 -${player.pendingTrapReduction}`;
      player.pendingTrapReduction = 0;
    }

    player.speed = Math.max(0, player.speed - 5);
    if (player.rpm > 0) player.rpm -= 5;
    else player.rpm = 0;

    this.checkLapCompletion(player);
    this.updateLeader();
    this.switchTurn();
  }

  private checkLapCompletion(player: PlayerState): void {
    while (player.position >= this.circuitLength) {
      player.position -= this.circuitLength;
      player.lap++;
      this.message += ` | ${player.name} Lap ${player.lap - 1} 완주!`;

      if (player.lap > this.totalLaps) {
        this.winner = this.currentPlayer;
        this.phase = 'finished';
        this.message = `${player.name} 우승! 모든 랩을 완주했습니다!`;
        return;
      }

      this.phase = 'lap_transition';
      this.message += ` 랩 전환! 패를 유지(드로우 +2) or 올 셔플(7장) 선택하세요.`;
    }

    const pProgress = (player.lap - 1) * this.circuitLength + player.position;
    const totalDist = this.totalLaps * this.circuitLength;
    if (pProgress / totalDist >= ZERO_ZONE_THRESHOLD) {
      this.phase = 'zero_zone';
      this.message = '제로존 진입! 더 이상 드로우할 수 없습니다. 남은 패로 승부하세요!';
    }
  }

  private switchTurn(): void {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.turnCount++;

    if (this.turnCount > 100) {
      this.phase = 'finished';
      const p1Total = (this.p1.lap - 1) * this.circuitLength + this.p1.position;
      const p2Total = (this.p2.lap - 1) * this.circuitLength + this.p2.position;
      this.winner = p1Total >= p2Total ? 1 : 2;
      this.message = `제한 턴 도달! ${this.winner === 1 ? 'P1' : 'P2'} 승리!`;
      return;
    }

    const player = this.getCurrentPlayerState();
    const isZeroZone = this.phase === 'zero_zone';

    if (!isZeroZone && player.hand.length < MAX_HAND) {
      this.drawCard(player, this.currentPlayer === 1 ? this.p1Deck : this.p2Deck);
    }

    this.adjustHandForLeader();
    this.assignSpecialCard();

    if (!isZeroZone) {
      this.phase = this.currentPlayer === 1 ? 'p1_turn' : 'p2_turn';
    } else {
      this.phase = 'zero_zone';
    }

    this.message = `${player.name}의 턴입니다. (속도: ${player.speed}, 열: ${player.rpm})`;
  }

  private adjustHandForLeader(): void {
    if (!this.leader) return;
    const trailerState = this.leader === 1 ? this.p2 : this.p1;

    const trailerMax = MAX_HAND + 1;
    if (trailerState.hand.length < trailerMax) {
      const deck = this.leader === 1 ? this.p2Deck : this.p1Deck;
      while (trailerState.hand.length < trailerMax && deck.length > 0) {
        const card = deck.pop();
        if (card) trailerState.hand.push(card);
      }
    }
  }

  private assignSpecialCard(): void {
    if (!this.leader) return;
    if (this.leader === 1 && !this.p1SpecialCard) {
      this.p1SpecialCard = SPECIAL_CARDS[Math.floor(Math.random() * SPECIAL_CARDS.length)];
    } else if (this.leader === 2 && !this.p2SpecialCard) {
      this.p2SpecialCard = SPECIAL_CARDS[Math.floor(Math.random() * SPECIAL_CARDS.length)];
    }
  }

  lapTransitionChoice(keepHand: boolean): void {
    const player = this.getCurrentPlayerState();
    const deck = this.currentPlayer === 1 ? this.p1Deck : this.p2Deck;

    if (keepHand) {
      for (let i = 0; i < 2; i++) this.drawCard(player, deck);
      this.message = `패 유지 +2 드로우. ${player.name} 턴 진행.`;
    } else {
      deck.push(...player.hand);
      player.hand = [];
      shuffle(deck);
      for (let i = 0; i < 7; i++) this.drawCard(player, deck);
      this.message = `올 셔플! 7장 드로우. ${player.name} 턴 진행.`;
    }

    this.phase = this.currentPlayer === 1 ? 'p1_turn' : 'p2_turn';
  }

  specialCardByLeader(): Card | null {
    if (this.leader === 1) return this.p1SpecialCard;
    if (this.leader === 2) return this.p2SpecialCard;
    return null;
  }
}
