"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";
import type { InventoryItem } from "@/lib/store";

interface Product {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: "Fashion" | "Home" | "Tech" | "Collectibles";
}

const PRODUCTS: Product[] = [
  { id: "jacket", name: "Neon Jacket", emoji: "🧥", price: 45, category: "Fashion" },
  { id: "sneakers", name: "Cloud Sneakers", emoji: "👟", price: 35, category: "Fashion" },
  { id: "shades", name: "Retro Shades", emoji: "🕶️", price: 20, category: "Fashion" },
  { id: "plant", name: "Potted Plant", emoji: "🪴", price: 15, category: "Home" },
  { id: "lamp", name: "Desk Lamp", emoji: "💡", price: 18, category: "Home" },
  { id: "sofa", name: "Mini Sofa", emoji: "🛋️", price: 60, category: "Home" },
  { id: "phone", name: "Holo Phone", emoji: "📱", price: 80, category: "Tech" },
  { id: "watch", name: "Smart Watch", emoji: "⌚", price: 50, category: "Tech" },
  { id: "headphones", name: "Headphones", emoji: "🎧", price: 40, category: "Tech" },
  { id: "trophy", name: "Golden Trophy", emoji: "🏆", price: 100, category: "Collectibles" },
  { id: "gem", name: "Rare Gem", emoji: "💎", price: 120, category: "Collectibles" },
  { id: "medal", name: "Bronze Medal", emoji: "🥉", price: 25, category: "Collectibles" },
];

const CATEGORIES = ["All", "Fashion", "Home", "Tech", "Collectibles"] as const;

export default function ShopPage() {
  const coins = useVirtualWorldStore((s) => s.coins);
  const spendCoins = useVirtualWorldStore((s) => s.spendCoins);
  const addInventoryItem = useVirtualWorldStore((s) => s.addInventoryItem);
  const inventory = useVirtualWorldStore((s) => s.inventory);

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [cart, setCart] = useState<Product[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(
    () => (category === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === category)),
    [category]
  );

  const total = cart.reduce((sum, p) => sum + p.price, 0);
  const ownedIds = new Set(inventory.filter((i) => i.category === "shop").map((i) => i.id));

  function addToCart(product: Product) {
    setMessage(null);
    setCart((c) => [...c, product]);
  }

  function removeFromCart(index: number) {
    setCart((c) => c.filter((_, i) => i !== index));
  }

  function checkout() {
    if (cart.length === 0) return;
    if (!spendCoins(total)) {
      setMessage("Not enough coins for this cart — earn more by cooking or winning arcade games!");
      return;
    }
    cart.forEach((product) => {
      const item: InventoryItem = {
        id: product.id,
        name: product.name,
        emoji: product.emoji,
        category: "shop",
      };
      addInventoryItem(item);
    });
    setMessage(`Purchased ${cart.length} item${cart.length > 1 ? "s" : ""} for ${total} coins!`);
    setCart([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/world" className="text-sm text-slate-400 hover:text-slate-200">
            ← Back to hub
          </Link>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">🛍️ The Mall</h1>
          <p className="text-slate-400">Spend your coins on gear for your virtual me.</p>
        </div>
        <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-300">
          🪙 {coins} coins
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === c
                ? "bg-indigo-500 text-white"
                : "border border-slate-700 text-slate-300 hover:border-slate-500"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filtered.map((product) => {
            const owned = ownedIds.has(product.id);
            return (
              <div
                key={product.id}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center"
              >
                <div className="text-4xl">{product.emoji}</div>
                <div className="font-semibold">{product.name}</div>
                <div className="text-sm text-amber-300">🪙 {product.price}</div>
                <button
                  onClick={() => addToCart(product)}
                  disabled={owned}
                  className="mt-1 w-full rounded-full bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {owned ? "Owned" : "Add to cart"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 font-semibold">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-slate-500">Your cart is empty.</p>
          ) : (
            <ul className="mb-4 flex flex-col gap-2">
              {cart.map((item, index) => (
                <li key={`${item.id}-${index}`} className="flex items-center justify-between text-sm">
                  <span>
                    {item.emoji} {item.name}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-amber-300">🪙{item.price}</span>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-slate-500 hover:text-rose-400"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mb-4 flex items-center justify-between border-t border-slate-800 pt-3 text-sm font-semibold">
            <span>Total</span>
            <span className="text-amber-300">🪙 {total}</span>
          </div>
          <button
            onClick={checkout}
            disabled={cart.length === 0}
            className="w-full rounded-full bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Checkout
          </button>
          {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
        </div>
      </div>
    </div>
  );
}
