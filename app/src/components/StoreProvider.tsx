"use client";

import { useState } from "react";
import { VirtualWorldStoreContext, createVirtualWorldStore, type VirtualWorldInit } from "@/lib/store";

export default function StoreProvider({
  init,
  children,
}: {
  init: VirtualWorldInit;
  children: React.ReactNode;
}) {
  const [store] = useState(() => createVirtualWorldStore(init));

  return <VirtualWorldStoreContext.Provider value={store}>{children}</VirtualWorldStoreContext.Provider>;
}
