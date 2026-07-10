"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { BOARD_ID, applyGiftChange, type GiftRow, type GiftState } from "./gifts";

export function useGifts() {
  const [state, setState] = useState<GiftState>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    let active = true;

    (async () => {
      const { data } = await sb.from("gifts").select("*").eq("board_id", BOARD_ID);
      if (!active) return;
      const initial: GiftState = {};
      for (const r of (data ?? []) as GiftRow[]) {
        (initial[r.villager_id] ??= {})[r.given_by] = r.given_at;
      }
      setState(initial);
      setReady(true);
    })();

    const channel = sb
      .channel("gifts-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts", filter: `board_id=eq.${BOARD_ID}` },
        (payload) => {
          const change =
            payload.eventType === "DELETE"
              ? { eventType: "DELETE" as const, old: payload.old as GiftRow }
              : { eventType: payload.eventType, new: payload.new as GiftRow };
          setState((prev) => applyGiftChange(prev, change));
        },
      )
      .subscribe();

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, []);

  const toggle = useCallback(
    async (villagerId: string, name: string) => {
      const mine = Boolean(state[villagerId]?.[name]);
      const row: GiftRow = {
        board_id: BOARD_ID,
        villager_id: villagerId,
        given_by: name,
        given_at: new Date().toISOString(),
      };
      setState((prev) =>
        applyGiftChange(
          prev,
          mine ? { eventType: "DELETE", old: row } : { eventType: "INSERT", new: row },
        ),
      );

      const res = await fetch("/api/gift", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ villagerId, givenBy: name, given: !mine }),
      }).catch(() => null);

      if (!res || !res.ok) {
        setState((prev) =>
          applyGiftChange(
            prev,
            mine ? { eventType: "INSERT", new: row } : { eventType: "DELETE", old: row },
          ),
        );
      }
    },
    [state],
  );

  return { state, toggle, ready };
}
