"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { InventoryItem } from "@/lib/store";

export type ListingKind = "fixed" | "auction";
export type ListingStatus = "active" | "sold" | "cancelled" | "expired";

export interface Listing {
  id: number;
  sellerId: string;
  sellerName: string;
  sellerColor: string;
  itemId: string;
  itemName: string;
  itemEmoji: string;
  itemCategory: InventoryItem["category"];
  kind: ListingKind;
  price: number;
  currentBid: number | null;
  currentBidderId: string | null;
  currentBidderName: string | null;
  endsAt: string | null;
  status: ListingStatus;
  createdAt: string;
}

interface ListingRow {
  id: number;
  seller_id: string;
  seller_name: string;
  seller_color: string;
  item_id: string;
  item_name: string;
  item_emoji: string;
  item_category: string;
  kind: string;
  price: number;
  current_bid: number | null;
  current_bidder_id: string | null;
  current_bidder_name: string | null;
  ends_at: string | null;
  status: string;
  created_at: string;
}

function mapRow(row: ListingRow): Listing {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerColor: row.seller_color,
    itemId: row.item_id,
    itemName: row.item_name,
    itemEmoji: row.item_emoji,
    itemCategory: row.item_category as InventoryItem["category"],
    kind: row.kind as ListingKind,
    price: row.price,
    currentBid: row.current_bid,
    currentBidderId: row.current_bidder_id,
    currentBidderName: row.current_bidder_name,
    endsAt: row.ends_at,
    status: row.status as ListingStatus,
    createdAt: row.created_at,
  };
}

export function useMarketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    await supabase.rpc("resolve_expired_auctions");
    const { data } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setListings((data ?? []).map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    // Deferred so the initial fetch's setState calls happen in a follow-up
    // tick rather than synchronously within the effect body.
    const initial = setTimeout(refresh, 0);

    const supabase = createClient();
    const channel = supabase
      .channel("marketplace-listings")
      .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_listings" }, () => {
        refresh();
      })
      .subscribe();

    const interval = setInterval(() => {
      refresh();
    }, 15000);

    return () => {
      clearTimeout(initial);
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [refresh]);

  return { listings, loading, refresh };
}

export async function createListing(input: {
  itemId: string;
  itemName: string;
  itemEmoji: string;
  itemCategory: InventoryItem["category"];
  kind: ListingKind;
  price: number;
  durationMinutes?: number;
}): Promise<{ error?: string }> {
  const { error } = await createClient().rpc("create_listing", {
    p_item_id: input.itemId,
    p_item_name: input.itemName,
    p_item_emoji: input.itemEmoji,
    p_item_category: input.itemCategory,
    p_kind: input.kind,
    p_price: input.price,
    p_duration_minutes: input.durationMinutes ?? 30,
  });
  return { error: error?.message };
}

export async function buyListing(id: number): Promise<{ error?: string }> {
  const { error } = await createClient().rpc("buy_listing", { p_listing_id: id });
  return { error: error?.message };
}

export async function placeBid(id: number, amount: number): Promise<{ error?: string }> {
  const { error } = await createClient().rpc("place_bid", { p_listing_id: id, p_amount: amount });
  return { error: error?.message };
}

export async function cancelListing(id: number): Promise<{ error?: string }> {
  const { error } = await createClient().rpc("cancel_listing", { p_listing_id: id });
  return { error: error?.message };
}
