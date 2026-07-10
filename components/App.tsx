"use client";

import { useState } from "react";
import { Checklist } from "./Checklist";
import { GiftsPanel } from "./GiftsPanel";
import { NameBar } from "./NameBar";
import { useDisplayName } from "@/lib/useDisplayName";
import type { Room, Villager } from "@/lib/schema";

export function App({ rooms, villagers }: { rooms: Room[]; villagers: Villager[] }) {
  const { name, setName, hydrated } = useDisplayName();
  const [tab, setTab] = useState<"cc" | "gifts">("cc");

  return (
    <div>
      <NameBar name={name} setName={setName} ready={hydrated} />
      <nav className="tabs">
        <button
          className={`tab${tab === "cc" ? " tab--active" : ""}`}
          type="button"
          onClick={() => setTab("cc")}
        >
          Community Center
        </button>
        <button
          className={`tab${tab === "gifts" ? " tab--active" : ""}`}
          type="button"
          onClick={() => setTab("gifts")}
        >
          Gifts
        </button>
      </nav>
      {tab === "cc" ? (
        <Checklist rooms={rooms} name={name} />
      ) : (
        <GiftsPanel villagers={villagers} name={name} />
      )}
    </div>
  );
}
