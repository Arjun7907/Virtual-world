"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { AVATAR_HEX } from "@/lib/avatarColors";
import type { AvatarColor } from "@/lib/store";

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
    x: 90,
    y: 90,
    width: 200,
    height: 140,
    href: "/world/shop",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    icon: "🍳",
    color: 0xf59e0b,
    x: 510,
    y: 90,
    width: 200,
    height: 140,
    href: "/world/kitchen",
  },
  {
    id: "arcade",
    label: "Arcade",
    icon: "🕹️",
    color: 0x8b5cf6,
    x: 90,
    y: 370,
    width: 200,
    height: 140,
    href: "/world/arcade",
  },
  {
    id: "profile",
    label: "Profile",
    icon: "🧑‍🎤",
    color: 0x0ea5e9,
    x: 510,
    y: 370,
    width: 200,
    height: 140,
    href: "/profile",
  },
];

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const PLAYER_SPEED = 220;

interface PhaserGameProps {
  avatarColor: AvatarColor;
  avatarName: string;
  onEnterZone: (href: string) => void;
}

export default function PhaserGame({ avatarColor, avatarName, onEnterZone }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [activeZone, setActiveZone] = useState<WorldZone | null>(null);

  useEffect(() => {
    let destroyed = false;

    async function boot() {
      const Phaser = (await import("phaser")).default;
      if (destroyed || !containerRef.current) return;

      class HubScene extends Phaser.Scene {
        player!: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
        cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
        enterKey!: Phaser.Input.Keyboard.Key;
        zoneGraphics: Phaser.GameObjects.Zone[] = [];
        currentZoneId: string | null = null;
        promptText!: Phaser.GameObjects.Text;

        constructor() {
          super("hub");
        }

        create() {
          this.cameras.main.setBackgroundColor("#0f172a");

          // Ground
          this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH - 20, WORLD_HEIGHT - 20, 0x111827).setStrokeStyle(2, 0x1e293b);

          // Decorative path
          this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 140, 140, 0x1e293b, 0.6).setStrokeStyle(2, 0x334155);
          this.add.text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "🌳", { fontSize: "40px" }).setOrigin(0.5);

          // Buildings / zones
          WORLD_ZONES.forEach((zone) => {
            const cx = zone.x + zone.width / 2;
            const cy = zone.y + zone.height / 2;
            this.add
              .rectangle(cx, cy, zone.width, zone.height, zone.color, 0.25)
              .setStrokeStyle(2, zone.color);
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
          const hex = AVATAR_HEX[avatarColor].replace("#", "0x");
          const player = this.add.circle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 40, 16, parseInt(hex, 16));
          player.setStrokeStyle(3, 0xffffff);
          this.physics.add.existing(player);
          this.player = player as typeof this.player;
          this.player.body.setCollideWorldBounds(true);
          this.player.body.setCircle(16);

          this.add
            .text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 62, avatarName, {
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

          const nameTag = this.children.getByName("nameTag") as Phaser.GameObjects.Text;
          if (nameTag) {
            nameTag.setPosition(this.player.x, this.player.y + 26);
          }

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
