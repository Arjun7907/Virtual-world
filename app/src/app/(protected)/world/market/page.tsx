"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";
import type { InventoryItem } from "@/lib/store";
import PresenceBar from "@/components/PresenceBar";
import { AVATAR_BG_CLASS } from "@/lib/avatarColors";
import type { AvatarColor } from "@/lib/store";
import {
  useMarketplace,
  createListing,
  buyListing,
  placeBid,
  cancelListing,
  type Listing,
} from "@/lib/marketplace";

type Tab = "browse" | "sell";

const DURATIONS = [
  { label: "5 min", minutes: 5 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
];

function timeLeftLabel(endsAt: string | null, now: number) {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return "closing…";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MarketPage() {
  const userId = useVirtualWorldStore((s) => s.user.id);
  const coins = useVirtualWorldStore((s) => s.coins);
  const inventory = useVirtualWorldStore((s) => s.inventory);
  const refreshWallet = useVirtualWorldStore((s) => s.refreshWallet);

  const { listings, loading, refresh } = useMarketplace();
  const [tab, setTab] = useState<Tab>("browse");
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [bidDrafts, setBidDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | "sell" | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ownedItems = useMemo(() => {
    const counts = new Map<string, InventoryItem>();
    const totals = new Map<string, number>();
    inventory.forEach((item) => {
      counts.set(item.id, item);
      totals.set(item.id, (totals.get(item.id) ?? 0) + 1);
    });
    return Array.from(counts.values()).map((item) => ({ item, count: totals.get(item.id) ?? 0 }));
  }, [inventory]);

  async function afterAction(actionMessage: string) {
    await Promise.all([refreshWallet(), refresh()]);
    setMessage(actionMessage);
  }

  async function handleBuy(listing: Listing) {
    setBusy(listing.id);
    const { error } = await buyListing(listing.id);
    setBusy(null);
    if (error) {
      setMessage(error);
      return;
    }
    await afterAction(`Bought ${listing.itemEmoji} ${listing.itemName} for 🪙 ${listing.price}.`);
  }

  async function handleBid(listing: Listing) {
    const draft = bidDrafts[listing.id];
    const amount = Number(draft);
    if (!draft || Number.isNaN(amount) || amount <= 0) {
      setMessage("Enter a valid bid amount.");
      return;
    }
    setBusy(listing.id);
    const { error } = await placeBid(listing.id, Math.floor(amount));
    setBusy(null);
    if (error) {
      setMessage(error);
      return;
    }
    setBidDrafts((d) => ({ ...d, [listing.id]: "" }));
    await afterAction(`Bid 🪙 ${amount} on ${listing.itemEmoji} ${listing.itemName}.`);
  }

  async function handleCancel(listing: Listing) {
    setBusy(listing.id);
    const { error } = await cancelListing(listing.id);
    setBusy(null);
    if (error) {
      setMessage(error);
      return;
    }
    await afterAction(`Cancelled your listing for ${listing.itemEmoji} ${listing.itemName}.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/world" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to hub
        </Link>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">🏛️ The Exchange</h1>
        <p className="text-slate-400">Buy, sell, and bid on gear with other players — real coins, real people.</p>
      </div>

      <PresenceBar room="market" activity="browsing the exchange" />

      <div className="flex gap-2">
        <button
          onClick={() => setTab("browse")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === "browse" ? "bg-indigo-500 text-white" : "border border-slate-700 text-slate-300 hover:border-slate-500"
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => setTab("sell")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === "sell" ? "bg-indigo-500 text-white" : "border border-slate-700 text-slate-300 hover:border-slate-500"
          }`}
        >
          Sell
        </button>
        <div className="ml-auto rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-300">
          🪙 {coins}
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-300">
          {message}
        </div>
      )}

      {tab === "browse" && (
        <BrowseTab
          listings={listings}
          loading={loading}
          userId={userId}
          now={now}
          bidDrafts={bidDrafts}
          setBidDrafts={setBidDrafts}
          busy={busy}
          onBuy={handleBuy}
          onBid={handleBid}
          onCancel={handleCancel}
        />
      )}

      {tab === "sell" && (
        <SellTab
          ownedItems={ownedItems}
          busy={busy === "sell"}
          onSubmit={async (input) => {
            setBusy("sell");
            const { error } = await createListing(input);
            setBusy(null);
            if (error) {
              setMessage(error);
              return;
            }
            await afterAction(`Listed ${input.itemEmoji} ${input.itemName} on the exchange.`);
            setTab("browse");
          }}
        />
      )}
    </div>
  );
}

function BrowseTab({
  listings,
  loading,
  userId,
  now,
  bidDrafts,
  setBidDrafts,
  busy,
  onBuy,
  onBid,
  onCancel,
}: {
  listings: Listing[];
  loading: boolean;
  userId: string;
  now: number;
  bidDrafts: Record<number, string>;
  setBidDrafts: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  busy: number | "sell" | null;
  onBuy: (listing: Listing) => void;
  onBid: (listing: Listing) => void;
  onCancel: (listing: Listing) => void;
}) {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading the exchange…</p>;
  }

  if (listings.length === 0) {
    return <p className="text-sm text-slate-500">Nothing listed right now — be the first to sell something.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => {
        const isOwn = listing.sellerId === userId;
        const minBid = (listing.currentBid ?? listing.price - 1) + 1;

        return (
          <div key={listing.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-4xl">{listing.itemEmoji}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  listing.kind === "auction" ? "bg-violet-500/20 text-violet-300" : "bg-sky-500/20 text-sky-300"
                }`}
              >
                {listing.kind === "auction" ? "Auction" : "Fixed price"}
              </span>
            </div>
            <div>
              <div className="font-semibold">{listing.itemName}</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`h-3 w-3 rounded-full ${AVATAR_BG_CLASS[listing.sellerColor as AvatarColor]}`} />
                {isOwn ? "You" : listing.sellerName}
              </div>
            </div>

            {listing.kind === "fixed" ? (
              <>
                <div className="text-lg font-bold text-amber-300">🪙 {listing.price}</div>
                {isOwn ? (
                  <button
                    onClick={() => onCancel(listing)}
                    disabled={busy === listing.id}
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-rose-500/40 disabled:opacity-50"
                  >
                    Cancel listing
                  </button>
                ) : (
                  <button
                    onClick={() => onBuy(listing)}
                    disabled={busy === listing.id}
                    className="rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    {busy === listing.id ? "Buying…" : "Buy now"}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-bold text-amber-300">🪙 {listing.currentBid ?? listing.price}</div>
                  <div className="text-xs text-slate-500">{timeLeftLabel(listing.endsAt, now)}</div>
                </div>
                {listing.currentBidderName && (
                  <div className="text-xs text-slate-500">High bidder: {listing.currentBidderName}</div>
                )}
                {isOwn ? (
                  <button
                    onClick={() => onCancel(listing)}
                    disabled={busy === listing.id || listing.currentBidderId !== null}
                    title={listing.currentBidderId !== null ? "Can't cancel once someone has bid" : undefined}
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-rose-500/40 disabled:opacity-50"
                  >
                    Cancel listing
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={bidDrafts[listing.id] ?? ""}
                      onChange={(e) => setBidDrafts((d) => ({ ...d, [listing.id]: e.target.value }))}
                      type="number"
                      min={minBid}
                      placeholder={`${minBid}+`}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm outline-none focus:border-violet-500"
                    />
                    <button
                      onClick={() => onBid(listing)}
                      disabled={busy === listing.id}
                      className="shrink-0 rounded-full bg-violet-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      Bid
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SellTab({
  ownedItems,
  busy,
  onSubmit,
}: {
  ownedItems: { item: InventoryItem; count: number }[];
  busy: boolean;
  onSubmit: (input: {
    itemId: string;
    itemName: string;
    itemEmoji: string;
    itemCategory: InventoryItem["category"];
    kind: "fixed" | "auction";
    price: number;
    durationMinutes?: number;
  }) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(ownedItems[0]?.item.id ?? null);
  const [kind, setKind] = useState<"fixed" | "auction">("fixed");
  const [price, setPrice] = useState("20");
  const [duration, setDuration] = useState(DURATIONS[1].minutes);

  if (ownedItems.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        You don&apos;t own anything to sell yet — pick up gear at the{" "}
        <Link href="/world/shop" className="text-indigo-400 hover:text-indigo-300">
          shop
        </Link>
        .
      </p>
    );
  }

  const selected = ownedItems.find((o) => o.item.id === selectedId)?.item ?? ownedItems[0].item;
  const priceNumber = Math.max(1, Math.floor(Number(price) || 0));

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:max-w-md">
      <label className="flex flex-col gap-1 text-sm">
        Item
        <select
          value={selected.id}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500"
        >
          {ownedItems.map(({ item, count }) => (
            <option key={item.id} value={item.id}>
              {item.emoji} {item.name} (own {count})
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2 text-sm">
        Sale type
        <div className="flex gap-2">
          <button
            onClick={() => setKind("fixed")}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              kind === "fixed" ? "bg-sky-500 text-white" : "border border-slate-700 text-slate-300"
            }`}
          >
            Fixed price
          </button>
          <button
            onClick={() => setKind("auction")}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              kind === "auction" ? "bg-violet-500 text-white" : "border border-slate-700 text-slate-300"
            }`}
          >
            Auction
          </button>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {kind === "fixed" ? "Price" : "Starting bid"}
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          min={1}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500"
        />
      </label>

      {kind === "auction" && (
        <label className="flex flex-col gap-1 text-sm">
          Duration
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.minutes}
                onClick={() => setDuration(d.minutes)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  duration === d.minutes ? "bg-violet-500 text-white" : "border border-slate-700 text-slate-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </label>
      )}

      <button
        onClick={() =>
          onSubmit({
            itemId: selected.id,
            itemName: selected.name,
            itemEmoji: selected.emoji,
            itemCategory: selected.category,
            kind,
            price: priceNumber,
            durationMinutes: kind === "auction" ? duration : undefined,
          })
        }
        disabled={busy}
        className="rounded-full bg-indigo-500 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Listing…" : `List ${selected.emoji} ${selected.name}`}
      </button>
    </div>
  );
}
