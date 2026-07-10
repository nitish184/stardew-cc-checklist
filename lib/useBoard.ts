"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "./supabaseBrowser";
import {
  BOARD_ID,
  applyRemoteChange,
  checkedItemsFromBoard,
  indexSlots,
  type BoardState,
  type CheckRow,
} from "./board";
import type { BundleItem, Room } from "./schema";

export function useBoard(rooms: Room[]) {
  const [attribution, setAttribution] = useState<BoardState>({});
  const [ready, setReady] = useState(false);
  const index = useMemo(() => indexSlots(rooms), [rooms]);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    let active = true;

    (async () => {
      const { data } = await sb.from("checks").select("*").eq("board_id", BOARD_ID);
      if (!active) return;
      const initial: BoardState = {};
      for (const r of (data ?? []) as CheckRow[]) {
        initial[r.slot_id] = { checkedBy: r.checked_by, checkedAt: r.checked_at };
      }
      setAttribution(initial);
      setReady(true);
    })();

    const channel = sb
      .channel("checks-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checks", filter: `board_id=eq.${BOARD_ID}` },
        (payload) => {
          const change =
            payload.eventType === "DELETE"
              ? { eventType: "DELETE" as const, old: payload.old as CheckRow }
              : { eventType: payload.eventType, new: payload.new as CheckRow };
          setAttribution((prev) => applyRemoteChange(prev, change));
        },
      )
      .subscribe();

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, []);

  const checked = useMemo(() => checkedItemsFromBoard(attribution, index), [attribution, index]);

  const toggle = useCallback(
    async (slot: BundleItem, name: string) => {
      const currentlyChecked = Boolean(attribution[slot.id]);

      setAttribution((prev) => {
        const next = { ...prev };
        if (currentlyChecked) delete next[slot.id];
        else next[slot.id] = { checkedBy: name, checkedAt: new Date().toISOString() };
        return next;
      });

      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, checked: !currentlyChecked, checkedBy: name }),
      }).catch(() => null);

      if (!res || !res.ok) {
        // revert the optimistic change; realtime would otherwise never confirm it
        setAttribution((prev) => {
          const next = { ...prev };
          if (currentlyChecked) next[slot.id] = { checkedBy: name, checkedAt: "" };
          else delete next[slot.id];
          return next;
        });
      }
    },
    [attribution],
  );

  return { attribution, checked, toggle, ready };
}
