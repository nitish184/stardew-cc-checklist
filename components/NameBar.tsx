"use client";

import { useState } from "react";

export function NameBar({
  name,
  setName,
  ready,
}: {
  name: string;
  setName: (n: string) => void;
  ready: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const hasName = name.trim() !== "";

  if (!ready) return <div className="namebar namebar--muted">Loading…</div>;

  if (!hasName || editing) {
    return (
      <div className="namebar">
        <label className="namebar__label" htmlFor="displayname">
          Pick a display name to tick items &amp; gifts
        </label>
        <div className="namebar__row">
          <input
            id="displayname"
            className="control control--search"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Your name…"
          />
          <button
            className="btn"
            type="button"
            disabled={draft.trim() === ""}
            onClick={() => {
              setName(draft);
              setEditing(false);
            }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="namebar">
      <span className="namebar__who">
        Playing as <strong>{name}</strong>
      </span>
      <button
        className="btn btn--ghost"
        type="button"
        onClick={() => {
          setDraft(name);
          setEditing(true);
        }}
      >
        Change
      </button>
    </div>
  );
}
