import Phaser from 'phaser';
import { GameManager } from '../game/GameManager';
import type { Card } from '../game/CardData';
import { SoundManager } from '../game/SoundManager';

const W = 1024;
const H = 768;
const CARD_W = 70;
const CARD_H = 47;

export class GameScene extends Phaser.Scene {
  private g!: GameManager;
  private sfx!: SoundManager;
  private p1HandGroup!: Phaser.GameObjects.Container;
  private p2HandGroup!: Phaser.GameObjects.Container;
  private p1Car!: Phaser.GameObjects.Graphics;
  private p2Car!: Phaser.GameObjects.Graphics;
  private trackGfx!: Phaser.GameObjects.Graphics;
  private p1TachoNeedle!: Phaser.GameObjects.Graphics;
  private p2TachoNeedle!: Phaser.GameObjects.Graphics;
  private p1TachoBg!: Phaser.GameObjects.Graphics;
  private p2TachoBg!: Phaser.GameObjects.Graphics;
  private overlayContainer!: Phaser.GameObjects.Container;
  private msgText!: Phaser.GameObjects.Text;
  private p1BarLabel!: Phaser.GameObjects.Text;
  private p2BarLabel!: Phaser.GameObjects.Text;
  private specialCardText!: Phaser.GameObjects.Text;
  private p1RpmTxt!: Phaser.GameObjects.Text;
  private p2RpmTxt!: Phaser.GameObjects.Text;

  private trackCx = 0;
  private trackCy = 0;
  private trackRx = 0;
  private trackRy = 0;

  private animCarProgress = { p1: 0, p2: 0 };
  private engineStarted = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.g = new GameManager();
    this.sfx = new SoundManager();
    this.sfx.init();
    this.engineStarted = false;

    this.p1HandGroup = this.add.container(0, 0).setDepth(20);
    this.p2HandGroup = this.add.container(0, 0).setDepth(20);
    this.overlayContainer = this.add.container(0, 0).setDepth(100);

    this.cameras.main.setBackgroundColor(0x0d0d1a);

    this.buildLayout();
    this.refresh();
  }

  private buildLayout(): void {
    this.drawTopBar();
    this.drawOvalTrack();
    this.drawTachometers();
    this.drawProgressBar();
    this.drawActionButtons();
    this.drawCardAreas();
  }

  /* ───── TOP BAR ───── */
  private drawTopBar(): void {
    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0x111122, 0.9);
    g.fillRect(0, 0, W, 34);
    g.lineStyle(1, 0x333366);
    g.lineBetween(0, 34, W, 34);

    this.add.text(12, 8, 'RACING TCG', {
      fontSize: '13px', color: '#44aaff', fontStyle: 'bold',
    }).setDepth(11);

    this.msgText = this.add.text(W / 2, 8, '', {
      fontSize: '12px', color: '#ffdd44',
    }).setDepth(11).setOrigin(0.5, 0);
  }

  /* ───── OVAL TRACK ───── */
  private drawOvalTrack(): void {
    this.trackCx = W / 2;
    this.trackCy = 190;
    this.trackRx = 240;
    this.trackRy = 100;

    const g = this.add.graphics().setDepth(5);
    this.trackGfx = g;
    this.redrawTrack();

    this.p1Car = this.add.graphics().setDepth(8);
    this.p2Car = this.add.graphics().setDepth(8);
  }

  private redrawTrack(): void {
    const g = this.trackGfx;
    g.clear();

    // track fill
    g.fillStyle(0x1a1a2e, 1);
    g.fillEllipse(this.trackCx, this.trackCy, this.trackRx * 2 + 40, this.trackRy * 2 + 40);
    g.fillStyle(0x0d0d1a, 1);
    g.fillEllipse(this.trackCx, this.trackCy, this.trackRx * 2 - 20, this.trackRy * 2 - 20);

    // lane markers
    g.lineStyle(1, 0x333355, 0.4);
    g.strokeEllipse(this.trackCx, this.trackCy, this.trackRx * 2, this.trackRy * 2);

    // start/finish line
    g.lineStyle(3, 0xffffff, 0.8);
    const sx = this.trackCx + this.trackRx;
    const sy = this.trackCy;
    g.lineBetween(sx - 5, sy - 12, sx - 5, sy + 12);

    // checkered pattern near finish
    for (let i = -3; i <= 3; i++) {
      for (let j = -1; j <= 1; j++) {
        if ((i + j) % 2 === 0) continue;
        g.fillStyle(0xffffff, 0.3);
        g.fillRect(sx - 4 + i * 3, sy - 1 + j * 4, 2, 2);
      }
    }

    // track glow ring
    g.lineStyle(2, 0x4444aa, 0.3);
    g.strokeEllipse(this.trackCx, this.trackCy, this.trackRx * 2 + 30, this.trackRy * 2 + 30);
    g.lineStyle(2, 0x222244, 0.3);
    g.strokeEllipse(this.trackCx, this.trackCy, this.trackRx * 2 - 10, this.trackRy * 2 - 10);
  }

  private ovalPoint(progress: number): { x: number; y: number; angle: number } {
    const angle = progress * Math.PI * 2 - Math.PI / 2;
    const x = this.trackCx + this.trackRx * Math.cos(angle);
    const y = this.trackCy + this.trackRy * Math.sin(angle);

    const dx = -this.trackRx * Math.sin(angle);
    const dy = this.trackRy * Math.cos(angle);
    const carAngle = Math.atan2(dy, dx);

    return { x, y, angle: carAngle };
  }

  private drawCar(gfx: Phaser.GameObjects.Graphics, progress: number, color: number): void {
    const p = this.ovalPoint(progress);
    gfx.clear();

    gfx.fillStyle(color, 1);
    gfx.fillCircle(p.x, p.y, 8);

    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(p.x, p.y, 3);

    gfx.fillStyle(color, 0.6);
    gfx.fillCircle(p.x, p.y, 12);

    gfx.lineStyle(1, color, 0.3);
    gfx.strokeCircle(p.x, p.y, 16);

    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillCircle(p.x + Math.cos(p.angle) * 4, p.y + Math.sin(p.angle) * 4, 2);
  }

  /* ───── TACHOMETERS ───── */
  private drawTachometers(): void {
    const ty = 337;
    this.add.text(120, ty - 10, 'P1 RPM', { fontSize: '10px', color: '#44ff44' }).setDepth(10);

    this.p1TachoBg = this.add.graphics().setDepth(10);
    this.p1TachoNeedle = this.add.graphics().setDepth(11);

    this.add.text(W - 240, ty - 10, 'P2 RPM', { fontSize: '10px', color: '#4488ff' }).setDepth(10);

    this.p2TachoBg = this.add.graphics().setDepth(10);
    this.p2TachoNeedle = this.add.graphics().setDepth(11);

    this.initTacho(this.p1TachoBg, 0, ty - 2, 0x44ff44, true);
    this.initTacho(this.p2TachoBg, W - 240, ty - 2, 0x4488ff, false);
  }

  private initTacho(bgGfx: Phaser.GameObjects.Graphics, x: number, y: number, color: number, isP1: boolean): void {
    const r = 40;
    bgGfx.clear();
    bgGfx.fillStyle(0x111122, 1);
    bgGfx.fillCircle(x + r, y + r, r);
    bgGfx.lineStyle(1, 0x333366);
    bgGfx.strokeCircle(x + r, y + r, r);

    for (let i = 0; i < 10; i++) {
      const start = Math.PI + (i / 10) * Math.PI;
      const end = Math.PI + ((i + 1) / 10) * Math.PI;
      let segColor = 0x44ff44;
      if (i >= 7) segColor = 0xffdd00;
      if (i >= 9) segColor = 0xff3333;
      bgGfx.fillStyle(segColor, 0.6);
      bgGfx.slice(x + r, y + r, r * 0.6, start, end, false);
      bgGfx.fillPath();
    }

    bgGfx.fillStyle(color, 1);
    bgGfx.fillCircle(x + r, y + r, 4);

    const valText = this.add.text(x + r, y + r + 14, '', {
      fontSize: '11px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(12);

    if (isP1) this.p1RpmTxt = valText;
    else this.p2RpmTxt = valText;
  }

  private updateTacho(needle: Phaser.GameObjects.Graphics,
    x: number, y: number, rpm: number, color: number): void {
    needle.clear();
    const r = 40;
    const cx = x + r;
    const cy = y + r;
    const frac = Math.min(1, rpm / 100);
    const angle = Math.PI + frac * Math.PI;

    // needle
    needle.lineStyle(2, color, 0.9);
    needle.lineBetween(cx, cy, cx + Math.cos(angle) * r * 0.6, cy + Math.sin(angle) * r * 0.6);

    // glow at high RPM
    if (frac > 0.8) {
      const glowColor = frac > 0.95 ? 0xff0000 : 0xff8800;
      needle.fillStyle(glowColor, 0.15);
      needle.fillCircle(cx, cy, r + 4);
    }
  }

  /* ───── PROGRESS BAR ───── */
  private drawProgressBar(): void {
    const y = 293;
    const h = 16;
    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0x111122, 0.8);
    g.fillRoundedRect(20, y, W - 40, h, 4);

    // zero zone marker
    g.fillStyle(0xff3333, 0.15);
    g.fillRect(20 + (W - 40) * 0.8, y, (W - 40) * 0.2, h);

    g.lineStyle(1, 0x444466);
    g.strokeRoundedRect(20, y, W - 40, h, 4);

    this.p1BarLabel = this.add.text(12, y - 1, '', { fontSize: '10px', color: '#44ff44' }).setDepth(11);
    this.p2BarLabel = this.add.text(W - 12, y - 1, '', { fontSize: '10px', color: '#4488ff' }).setDepth(11).setOrigin(1, 0);
  }

  private updateProgressBar(): void {
    const s = this.g.snap();
    const y = 293;
    const h = 16;
    const totalDist = s.totalLaps * s.circuitLength;

    const p1p = Math.min(1, ((s.p1.lap - 1) * s.circuitLength + s.p1.position) / totalDist);
    const p2p = Math.min(1, ((s.p2.lap - 1) * s.circuitLength + s.p2.position) / totalDist);

    const g = this.add.graphics().setDepth(11);

    g.fillStyle(0x44ff44, 0.8);
    g.fillRect(21, y + 1, (W - 42) * p1p, (h - 2) / 2);

    g.fillStyle(0x4488ff, 0.8);
    g.fillRect(21, y + 1 + (h - 2) / 2, (W - 42) * p2p, (h - 2) / 2);

    this.time.delayedCall(100, () => g.destroy());
  }

  /* ───── ACTION BUTTONS ───── */
  private drawActionButtons(): void {
    const btnY = 478;
    const btnH = 28;

    const actions = [
      { label: '⏩ 가속', w: 90, cb: () => this.act('accelerate') },
      { label: '➡️ 턴 넘김', w: 100, cb: () => this.act('pass') },
    ];

    let x = 280;
    for (const a of actions) {
      const bg = this.add.graphics().setDepth(15);
      bg.fillStyle(0x0f3460, 1);
      bg.fillRoundedRect(x, btnY, a.w, btnH, 6);

      this.add.text(x + a.w / 2, btnY + btnH / 2, a.label, {
        fontSize: '12px', color: '#ffffff',
      }).setDepth(16).setOrigin(0.5, 0.5);

      const zone = this.add.zone(x, btnY, a.w, btnH).setInteractive().setDepth(17);
      zone.on('pointerdown', () => {
        bg.clear();
        bg.fillStyle(0x1a5080, 1);
        bg.fillRoundedRect(x, btnY, a.w, btnH, 6);
        a.cb();
      });
    }
  }

  /* ───── CARD AREAS ───── */
  private drawCardAreas(): void {
    // just containers
  }

  private renderHand(container: Phaser.GameObjects.Container, hand: Card[], y: number,
    isP1: boolean, canInteract: boolean): void {
    container.removeAll(true);

    const maxShow = Math.min(hand.length, 7);
    const gap = 6;
    const totalW = maxShow * (CARD_W + gap) - gap;
    const startX = (W - totalW) / 2;

    for (let i = 0; i < maxShow; i++) {
      const card = hand[i];
      const x = startX + i * (CARD_W + gap);
      const col = this.cardColor(card.type);

      const bg = this.add.graphics().setDepth(18);
      bg.fillStyle(0x1a1a3a, 0.95);
      bg.fillRoundedRect(x, y, CARD_W, CARD_H, 6);

      bg.lineStyle(2, col, 0.9);
      bg.strokeRoundedRect(x, y, CARD_W, CARD_H, 6);

      // type icon
      const icon = this.cardIcon(card.type);
      bg.fillStyle(col, 0.2);
      bg.fillCircle(x + 14, y + 13, 10);
      const iconText = this.add.text(x + 14, y + 13, icon, {
        fontSize: '13px',
      }).setDepth(19).setOrigin(0.5, 0.5);
      container.add(iconText);

      // card name
      const nameText = this.add.text(x + CARD_W / 2, y + 10, card.name, {
        fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
      }).setDepth(19).setOrigin(0.5, 0.5);
      container.add(nameText);

      // description (compact)
      const desc = this.add.text(x + CARD_W / 2, y + CARD_H - 10, card.description, {
        fontSize: '8px', color: '#aaaaaa',
      }).setDepth(19).setOrigin(0.5, 0.5);
      container.add(desc);

      container.add(bg);
      container.add(nameText);
      container.add(desc);

      if (canInteract) {
        const idx = i;
        const hz = this.add.zone(x, y, CARD_W, CARD_H).setInteractive().setDepth(20);
        hz.on('pointerover', () => {
          bg.clear();
          bg.fillStyle(0x222255, 1);
          bg.fillRoundedRect(x, y - 4, CARD_W, CARD_H + 4, 6);
          bg.lineStyle(3, 0xffffff, 1);
          bg.strokeRoundedRect(x, y - 4, CARD_W, CARD_H + 4, 6);
        });
        hz.on('pointerout', () => {
          bg.clear();
          bg.fillStyle(0x1a1a3a, 0.95);
          bg.fillRoundedRect(x, y, CARD_W, CARD_H, 6);
          bg.lineStyle(2, col, 0.9);
          bg.strokeRoundedRect(x, y, CARD_W, CARD_H, 6);
        });
        hz.on('pointerdown', () => this.doPlayCard(isP1 ? 1 : 2, idx));
        container.add(hz);
      }
    }

    // deck count badge
    const deckCount = isP1 ? this.g.snap().p1DeckCount : this.g.snap().p2DeckCount;
    const badge = this.add.text(W - 14, y + CARD_H / 2, `덱 ${deckCount}`, {
      fontSize: '9px', color: '#666688', backgroundColor: '#111122',
      padding: { x: 4, y: 2 },
    }).setDepth(19).setOrigin(1, 0.5);
    container.add(badge);
  }

  private cardColor(type: string): number {
    switch (type) {
      case 'boost': case 'drift': return 0x44ee66;
      case 'nitro': return 0xff8800;
      case 'shield': return 0x4488ff;
      case 'trap': return 0xff4455;
      case 'cruise': return 0x66bbff;
      default: return 0x888888;
    }
  }

  private cardIcon(type: string): string {
    switch (type) {
      case 'boost': return '⚡';
      case 'nitro': return '🔥';
      case 'shield': return '🛡';
      case 'trap': return '⚙';
      case 'cruise': return '🌊';
      case 'drift': return '🌀';
      default: return '•';
    }
  }

  /* ───── ACTIONS ───── */
  private act(action: string): void {
    if (action === 'accelerate') {
      if (this.g.phase !== 'p1_turn' && this.g.phase !== 'p2_turn') return;
      this.g.accelerate();
      this.sfx.updateEngine(this.g.getCurrentPlayerState().rpm);
    } else if (action === 'pass') {
      if (this.g.phase !== 'p1_turn' && this.g.phase !== 'p2_turn') return;
      const wasOverheated = this.g.getCurrentPlayerState().isOverheated;
      this.g.passTurn();
      if (wasOverheated) this.sfx.playOverheat();
    }
    this.refresh();
  }

  private doPlayCard(playerNum: 1 | 2, index: number): void {
    const isMyTurn = (playerNum === 1 && this.g.phase === 'p1_turn') ||
                     (playerNum === 2 && this.g.phase === 'p2_turn');
    if (!isMyTurn) return;
    this.g.playCard(index);
    this.sfx.playBoost();
    this.refresh();
  }

  /* ───── REFRESH ───── */
  private refresh(): void {
    const s = this.g.snap();

    // start engine on first interaction
    if (!this.engineStarted) {
      this.sfx.startEngine();
      this.engineStarted = true;
    }
    this.sfx.updateEngine(this.g.getCurrentPlayerState().rpm);

    // top bar
    this.msgText.setText(
      `LAP ${Math.min(s.p1.lap, 3)}/3  |  TURN ${s.turnCount}  |  ${s.leader ? (s.leader === 1 ? 'P1' : 'P2') + ' 선두' : '---'}  |  ${s.phase === 'p1_turn' ? 'P1 턴' : s.phase === 'p2_turn' ? 'P2 턴' : '---'}`
    );

    // animate cars smoothly
    const totalDist = s.totalLaps * s.circuitLength;
    const p1Progress = ((s.p1.lap - 1) * s.circuitLength + s.p1.position) / totalDist;
    const p2Progress = ((s.p2.lap - 1) * s.circuitLength + s.p2.position) / totalDist;

    this.animCarProgress.p1 += (p1Progress - this.animCarProgress.p1) * 0.1;
    this.animCarProgress.p2 += (p2Progress - this.animCarProgress.p2) * 0.1;

    this.drawCar(this.p1Car, this.animCarProgress.p1, 0x44ff44);
    this.drawCar(this.p2Car, this.animCarProgress.p2, 0x4488ff);

    // background track
    this.redrawTrack();

    // tachometers
    const tachoY = 337;
    this.updateTacho(this.p1TachoNeedle, 120, tachoY - 2, s.p1.rpm, 0x44ff44);
    this.updateTacho(this.p2TachoNeedle, W - 240, tachoY - 2, s.p2.rpm, 0x4488ff);

    this.p1RpmTxt.setText(`${s.p1.rpm}`);
    this.p2RpmTxt.setText(`${s.p2.rpm}`);

    this.updateProgressBar();

    // hands
    const p1CanInteract = s.phase === 'p1_turn' && !s.p1.isOverheated;
    const p2CanInteract = s.phase === 'p2_turn' && !s.p2.isOverheated;
    this.renderHand(this.p1HandGroup, s.p1.hand, 423, true, p1CanInteract);
    this.renderHand(this.p2HandGroup, s.p2.hand, 48, false, p2CanInteract);

    this.p1BarLabel.setText(`P1 ${Math.round(p1Progress * 100)}%`);
    this.p2BarLabel.setText(`P2 ${Math.round(p2Progress * 100)}%`);

    // special card display
    this.showSpecialCards(s.p1SpecialCard, s.p2SpecialCard);

    if (s.winner) {
      this.sfx.stopEngine();
      this.sfx.playWin();
      this.showOverlay(`🏆 ${s.winner === 1 ? 'P1' : 'P2'} WIN! 🏆`, () => {
        this.g = new GameManager();
        this.scene.restart();
      });
    }

    if (s.phase === 'lap_transition') {
      this.showLapOverlay();
    }
  }

  private showSpecialCards(p1sc: Card | null, p2sc: Card | null): void {
    const s = this.g.snap();
    const leader = s.leader === 1 ? p1sc : (s.leader === 2 ? p2sc : null);
    if (leader) {
      if (!this.specialCardText) {
        this.specialCardText = this.add.text(W / 2, 35, '', {
          fontSize: '11px', color: '#ff8800',
        }).setDepth(25).setOrigin(0.5, 0);
      }
      this.specialCardText.setText(`🏁 ${leader.name}: ${leader.description}`);
    } else if (this.specialCardText) {
      this.specialCardText.setText('');
    }
  }

  /* ───── OVERLAYS ───── */
  private showOverlay(message: string, onRestart: () => void): void {
    this.overlayContainer.removeAll(true);
    const g = this.add.graphics().setDepth(100);
    g.fillStyle(0x000000, 0.75);
    g.fillRect(0, 0, W, H);
    this.overlayContainer.add(g);

    const txt = this.add.text(W / 2, H / 2 - 40, message, {
      fontSize: '36px', color: '#ffdd00', fontStyle: 'bold',
    }).setDepth(101).setOrigin(0.5, 0.5);
    this.overlayContainer.add(txt);

    this.makeButton(W / 2 - 80, H / 2 + 40, 'REMATCH', 160, onRestart);
  }

  private showLapOverlay(): void {
    this.overlayContainer.removeAll(true);
    const g = this.add.graphics().setDepth(100);
    g.fillStyle(0x000000, 0.7);
    g.fillRect(0, 0, W, H);
    this.overlayContainer.add(g);

    const txt = this.add.text(W / 2, H / 2 - 50, '🏁 LAP COMPLETE! 🏁', {
      fontSize: '26px', color: '#ffdd00', fontStyle: 'bold',
    }).setDepth(101).setOrigin(0.5, 0.5);
    this.overlayContainer.add(txt);

    this.sfx.playLapComplete();

    this.makeButton(W / 2 - 130, H / 2 + 10, 'A. 패 유지 (+2 드로우)', 260, () => {
      this.g.lapTransitionChoice(true);
      this.overlayContainer.removeAll(true);
      this.refresh();
    });

    this.makeButton(W / 2 - 130, H / 2 + 55, 'B. 올 셔플 (7장 드로우)', 260, () => {
      this.g.lapTransitionChoice(false);
      this.overlayContainer.removeAll(true);
      this.refresh();
    });
  }

  private makeButton(x: number, y: number, label: string, w: number, cb: () => void): void {
    const bg = this.add.graphics().setDepth(101);
    bg.fillStyle(0x0f3460, 1);
    bg.fillRoundedRect(x, y, w, 34, 6);
    this.overlayContainer.add(bg);

    const txt = this.add.text(x + w / 2, y + 17, label, {
      fontSize: '14px', color: '#ffffff',
    }).setDepth(102).setOrigin(0.5, 0.5);
    this.overlayContainer.add(txt);

    const zone = this.add.zone(x, y, w, 34).setInteractive().setDepth(103);
    zone.on('pointerdown', cb);
    this.overlayContainer.add(zone);
  }

  /* ───── CLEANUP ───── */
  shutdown(): void {
    this.sfx.stopEngine();
  }
}
