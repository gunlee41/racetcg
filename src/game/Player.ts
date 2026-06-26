import type { Card } from './CardData';

export class PlayerState {
  name: string;
  hand: Card[] = [];
  speed: number = 0;
  rpm: number = 0;
  position: number = 0;
  lap: number = 1;
  hasShield: boolean = false;
  pendingTrapReduction: number = 0;

  constructor(name: string) {
    this.name = name;
  }

  get isOverheated(): boolean {
    return this.rpm >= 100;
  }

  get displayName(): string {
    return this.name + (this.isOverheated ? ' (과열!)' : '');
  }

  resetForNewLap(): void {
    this.pendingTrapReduction = 0;
  }

  takeOverheatPenalty(): void {
    if (this.isOverheated) {
      this.speed = Math.max(0, this.speed - 40);
      this.rpm = 30;
    }
  }
}
