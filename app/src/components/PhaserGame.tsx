"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { AVATAR_HEX } from "@/lib/avatarColors";
import type { AvatarColor } from "@/lib/store";
import type { PresenceUser } from "@/lib/presence";

export interface WorldZone {
  id: string;
  label: string;
  icon: string;
  color: number;
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
}

export const WORLD_ZONES: WorldZone[] = [
  {
    id: "shop",
    label: "Shop",
    icon: "🛍️",
    color: 0xf43f5e,
    x: 20,
    y: 50,
    width: 170,
    height: 110,
    href: "/world/shop",
  },
  {
    id: "work",
    label: "Work",
    icon: "💼",
    color: 0x22c55e,
    x: 210,
    y: 50,
    width: 170,
    height: 110,
    href: "/world/work",
  },
  {
    id: "business",
    label: "Business",
    icon: "🚀",
    color: 0x14b8a6,
    x: 400,
    y: 50,
    width: 170,
    height: 110,
    href: "/world/business",
  },
  {
    id: "market",
    label: "Exchange",
    icon: "🏛️",
    color: 0xeab308,
    x: 590,
    y: 50,
    width: 170,
    height: 110,
    href: "/world/market",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    icon: "🍳",
    color: 0xf59e0b,
    x: 20,
    y: 440,
    width: 170,
    height: 110,
    href: "/world/kitchen",
  },
  {
    id: "arcade",
    label: "Arcade",
    icon: "🕹️",
    color: 0x8b5cf6,
    x: 210,
    y: 440,
    width: 170,
    height: 110,
    href: "/world/arcade",
  },
  {
    id: "profile",
    label: "Profile",
    icon: "🧑‍🎤",
    color: 0x0ea5e9,
    x: 400,
    y: 440,
    width: 170,
    height: 110,
    href: "/profile",
  },
];

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const PLAYER_SPEED = 220;
const SPAWN_X = WORLD_WIDTH / 2;
const SPAWN_Y = WORLD_HEIGHT / 2 + 40;
const POSITION_EMIT_INTERVAL_MS = 120;

interface OtherSprite {
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  shadow: Phaser.GameObjects.Ellipse;
  targetX: number;
  targetY: number;
}

interface HubSceneLike {
  syncOthers: (list: PresenceUser[]) => void;
}

interface PhaserGameProps {
  avatarColor: AvatarColor;
  avatarName: string;
  onEnterZone: (href: string) => void;
  otherPlayers: PresenceUser[];
  onPositionChange: (x: number, y: number) => void;
}

export default function PhaserGame({
  avatarColor,
  avatarName,
  onEnterZone,
  otherPlayers,
  onPositionChange,
}: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<HubSceneLike | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const [activeZone, setActiveZone] = useState<WorldZone | null>(null);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    sceneRef.current?.syncOthers(otherPlayers);
  }, [otherPlayers]);

  useEffect(() => {
    let destroyed = false;

    async function boot() {
      const Phaser = (await import("phaser")).default;
      if (destroyed || !containerRef.current) return;

      class HubScene extends Phaser.Scene implements HubSceneLike {
        player!: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
        playerShadow!: Phaser.GameObjects.Ellipse;
        cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
        enterKey!: Phaser.Input.Keyboard.Key;
        zoneGraphics: Phaser.GameObjects.Zone[] = [];
        zoneOutlines: Map<string, Phaser.GameObjects.Graphics> = new Map();
        currentZoneId: string | null = null;
        promptText!: Phaser.GameObjects.Text;
        otherSprites: Map<string, OtherSprite> = new Map();
        lastEmit = 0;

        constructor() {
          super("hub");
        }

        create() {
          sceneRef.current = this;
          this.cameras.main.setBackgroundColor("#0b1220");

          // Ground with a soft border and a subtle dot-grid texture.
          const ground = this.add.graphics();
          ground.fillStyle(0x0f172a, 1);
          ground.fillRoundedRect(10, 10, WORLD_WIDTH - 20, WORLD_HEIGHT - 20, 20);
          ground.lineStyle(2, 0x1e293b, 1);
          ground.strokeRoundedRect(10, 10, WORLD_WIDTH - 20, WORLD_HEIGHT - 20, 20);
          ground.fillStyle(0x1e293b, 0.45);
          for (let gx = 34; gx < WORLD_WIDTH - 20; gx += 32) {
            for (let gy = 34; gy < WORLD_HEIGHT - 20; gy += 32) {
              ground.fillCircle(gx, gy, 1.3);
            }
          }

          // Central plaza with a gently pulsing fountain.
          const plazaX = WORLD_WIDTH / 2;
          const plazaY = WORLD_HEIGHT / 2;
          const plaza = this.add.graphics();
          plaza.fillStyle(0x1e293b, 0.55);
          plaza.fillCircle(plazaX, plazaY, 90);
          plaza.lineStyle(2, 0x334155, 0.9);
          plaza.strokeCircle(plazaX, plazaY, 90);

          const fountain = this.add.graphics();
          fountain.fillStyle(0x0ea5e9, 0.22);
          fountain.fillCircle(plazaX, plazaY, 36);
          fountain.lineStyle(2, 0x38bdf8, 0.7);
          fountain.strokeCircle(plazaX, plazaY, 36);
          fountain.fillStyle(0x38bdf8, 0.55);
          fountain.fillCircle(plazaX, plazaY, 15);
          this.tweens.add({
            targets: fountain,
            alpha: { from: 0.55, to: 1 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });

          [
            { x: plazaX - 115, y: plazaY - 55 },
            { x: plazaX + 115, y: plazaY - 55 },
            { x: plazaX - 115, y: plazaY + 55 },
            { x: plazaX + 115, y: plazaY + 55 },
          ].forEach((spot) => {
            this.add.text(spot.x, spot.y, "🌳", { fontSize: "24px" }).setOrigin(0.5).setAlpha(0.85);
          });

          // Buildings / zones — soft shadow, rounded gradient body, roof accent.
          WORLD_ZONES.forEach((zone) => {
            const cx = zone.x + zone.width / 2;
            const cy = zone.y + zone.height / 2;
            const radius = 14;

            const shadow = this.add.graphics();
            shadow.fillStyle(0x000000, 0.3);
            shadow.fillRoundedRect(zone.x + 3, zone.y + 6, zone.width, zone.height, radius);

            const body = Phaser.Display.Color.IntegerToColor(zone.color);
            const top = body.clone().lighten(15).color;
            const bottom = body.clone().darken(5).color;

            const outline = this.add.graphics();
            outline.fillGradientStyle(top, top, bottom, bottom, 0.32, 0.32, 0.18, 0.18);
            outline.fillRoundedRect(zone.x, zone.y, zone.width, zone.height, radius);
            outline.lineStyle(2, zone.color, 0.9);
            outline.strokeRoundedRect(zone.x, zone.y, zone.width, zone.height, radius);
            outline.lineStyle(3, 0xffffff, 0.22);
            outline.beginPath();
            outline.moveTo(zone.x + radius, zone.y + 3);
            outline.lineTo(zone.x + zone.width - radius, zone.y + 3);
            outline.strokePath();
            this.zoneOutlines.set(zone.id, outline);

            this.add
              .text(cx, cy - 16, zone.icon, { fontSize: "34px" })
              .setOrigin(0.5);
            this.add
              .text(cx, cy + 28, zone.label, {
                fontSize: "16px",
                color: "#e2e8f0",
                fontStyle: "bold",
              })
              .setOrigin(0.5);

            const zoneRect = this.add.zone(cx, cy, zone.width, zone.height);
            this.physics.add.existing(zoneRect, true);
            (zoneRect as unknown as { zoneId: string }).zoneId = zone.id;
            this.zoneGraphics.push(zoneRect);
          });

          // Player
          this.playerShadow = this.add.ellipse(SPAWN_X, SPAWN_Y + 14, 26, 10, 0x000000, 0.35);

          const hex = AVATAR_HEX[avatarColor].replace("#", "0x");
          const player = this.add.circle(SPAWN_X, SPAWN_Y, 16, parseInt(hex, 16));
          player.setStrokeStyle(3, 0xffffff);
          this.physics.add.existing(player);
          this.player = player as typeof this.player;
          this.player.body.setCollideWorldBounds(true);
          this.player.body.setCircle(16);

          this.add
            .text(SPAWN_X, SPAWN_Y + 22, avatarName, {
              fontSize: "13px",
              color: "#cbd5e1",
            })
            .setOrigin(0.5)
            .setName("nameTag");

          this.physics.world.setBounds(10, 10, WORLD_WIDTH - 20, WORLD_HEIGHT - 20);

          this.cursors = this.input.keyboard!.createCursorKeys();
          this.wasd = {
            W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
          };
          this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

          this.promptText = this.add
            .text(WORLD_WIDTH / 2, WORLD_HEIGHT - 24, "", {
              fontSize: "14px",
              color: "#facc15",
            })
            .setOrigin(0.5);

          this.zoneGraphics.forEach((zone) => {
            this.physics.add.overlap(this.player, zone, () => {
              const zoneId = (zone as unknown as { zoneId: string }).zoneId;
              this.currentZoneId = zoneId;
            });
          });

          this.syncOthers(otherPlayers);
        }

        syncOthers(list: PresenceUser[]) {
          const seen = new Set<string>();
          list.forEach((p) => {
            seen.add(p.userId);
            const targetX = p.x ?? SPAWN_X;
            const targetY = p.y ?? SPAWN_Y;
            let entry = this.otherSprites.get(p.userId);
            if (!entry) {
              const shadow = this.add.ellipse(targetX, targetY + 14, 24, 9, 0x000000, 0.3);
              const hex = parseInt(AVATAR_HEX[p.color].replace("#", "0x"), 16);
              const circle = this.add.circle(targetX, targetY, 16, hex).setAlpha(0.85);
              circle.setStrokeStyle(2, 0xffffff, 0.6);
              const label = this.add
                .text(targetX, targetY + 26, p.name, { fontSize: "12px", color: "#94a3b8" })
                .setOrigin(0.5);
              entry = { circle, label, shadow, targetX, targetY };
              this.otherSprites.set(p.userId, entry);
            } else {
              entry.targetX = targetX;
              entry.targetY = targetY;
            }
          });

          for (const [id, entry] of this.otherSprites) {
            if (!seen.has(id)) {
              entry.circle.destroy();
              entry.label.destroy();
              entry.shadow.destroy();
              this.otherSprites.delete(id);
            }
          }
        }

        update() {
          const body = this.player.body;
          body.setVelocity(0);

          const left = this.cursors.left.isDown || this.wasd.A.isDown;
          const right = this.cursors.right.isDown || this.wasd.D.isDown;
          const up = this.cursors.up.isDown || this.wasd.W.isDown;
          const down = this.cursors.down.isDown || this.wasd.S.isDown;

          if (left) body.setVelocityX(-PLAYER_SPEED);
          else if (right) body.setVelocityX(PLAYER_SPEED);
          if (up) body.setVelocityY(-PLAYER_SPEED);
          else if (down) body.setVelocityY(PLAYER_SPEED);
          body.velocity.normalize().scale(PLAYER_SPEED * (left || right || up || down ? 1 : 0));

          const isMoving = left || right || up || down;
          const bob = isMoving ? 1 + Math.sin(this.time.now / 70) * 0.06 : 1;
          this.player.setScale(bob);
          this.playerShadow.setPosition(this.player.x, this.player.y + 14);
          this.playerShadow.setScale(isMoving ? 1 / bob : 1);

          const nameTag = this.children.getByName("nameTag") as Phaser.GameObjects.Text;
          if (nameTag) {
            nameTag.setPosition(this.player.x, this.player.y + 26);
          }

          if (this.time.now - this.lastEmit > POSITION_EMIT_INTERVAL_MS) {
            this.lastEmit = this.time.now;
            onPositionChangeRef.current(this.player.x, this.player.y);
          }

          this.otherSprites.forEach((entry) => {
            entry.circle.x = Phaser.Math.Linear(entry.circle.x, entry.targetX, 0.15);
            entry.circle.y = Phaser.Math.Linear(entry.circle.y, entry.targetY, 0.15);
            entry.label.setPosition(entry.circle.x, entry.circle.y + 26);
            entry.shadow.setPosition(entry.circle.x, entry.circle.y + 14);
          });

          const previousZoneId = this.currentZoneId;
          this.currentZoneId = null;
          this.zoneGraphics.forEach((zone) => {
            const body2 = zone.body as Phaser.Physics.Arcade.StaticBody;
            if (
              Phaser.Geom.Rectangle.Overlaps(
                new Phaser.Geom.Rectangle(this.player.x - 16, this.player.y - 16, 32, 32),
                new Phaser.Geom.Rectangle(body2.x, body2.y, body2.width, body2.height)
              )
            ) {
              this.currentZoneId = (zone as unknown as { zoneId: string }).zoneId;
            }
          });

          if (this.currentZoneId !== previousZoneId) {
            if (previousZoneId) this.zoneOutlines.get(previousZoneId)?.setAlpha(1);
          }
          if (this.currentZoneId) {
            const glow = 0.75 + Math.sin(this.time.now / 150) * 0.25;
            this.zoneOutlines.get(this.currentZoneId)?.setAlpha(glow);
          }

          const zoneMeta = WORLD_ZONES.find((z) => z.id === this.currentZoneId) ?? null;
          if (this.currentZoneId !== previousZoneId) {
            setActiveZone(zoneMeta);
          }

          if (zoneMeta) {
            this.promptText.setText(`Press ENTER to visit ${zoneMeta.label}`);
          } else {
            this.promptText.setText("Walk around with WASD / arrow keys");
          }

          if (Phaser.Input.Keyboard.JustDown(this.enterKey) && zoneMeta) {
            onEnterZone(zoneMeta.href);
          }
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        parent: containerRef.current,
        backgroundColor: "#0f172a",
        physics: {
          default: "arcade",
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene: [HubScene],
      };

      gameRef.current = new Phaser.Game(config);
    }

    boot();

    return () => {
      destroyed = true;
      sceneRef.current = null;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarColor, avatarName]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl border border-slate-800 shadow-2xl shadow-black/40"
      />
      <div className="flex min-h-[28px] items-center gap-2 text-sm text-slate-400">
        {activeZone ? (
          <span className="text-amber-300">
            {activeZone.icon} Press <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">Enter</kbd> to
            visit {activeZone.label}
          </span>
        ) : (
          <span>Use WASD or the arrow keys to walk your avatar around the hub.</span>
        )}
      </div>
    </div>
  );
}
