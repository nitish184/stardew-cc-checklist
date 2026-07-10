"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function Gate() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passphrase }),
    }).catch(() => null);
    setBusy(false);
    if (res && res.ok) router.refresh();
    else setError(true);
  }

  return (
    <form className="gate" onSubmit={submit}>
      <label className="gate__label" htmlFor="passphrase">
        Enter the shared passphrase
      </label>
      <div className="gate__row">
        <input
          id="passphrase"
          className="control control--search"
          type="password"
          autoFocus
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Passphrase…"
        />
        <button className="btn" type="submit" disabled={busy || passphrase.trim() === ""}>
          {busy ? "Checking…" : "Enter"}
        </button>
      </div>
      {error && <p className="gate__error">That passphrase didn&apos;t work. Try again.</p>}
    </form>
  );
}
