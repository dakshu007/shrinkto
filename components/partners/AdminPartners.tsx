"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Check, X, ExternalLink, Loader2 } from "@/components/icons";
import type { Partner } from "@/lib/partners/types";
import styles from "./AdminPartners.module.css";

export function AdminPartners() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // Remember the token locally for convenience.
  useEffect(() => {
    const saved = localStorage.getItem("shrinkto:adminToken");
    if (saved) setToken(saved);
  }, []);

  const load = useCallback(async (tok: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/partners/admin?token=${encodeURIComponent(tok)}`, { cache: "no-store" });
      if (res.status === 401) throw new Error("Wrong admin token.");
      if (!res.ok) throw new Error("Could not load applications.");
      const data = await res.json();
      setPartners(data.partners ?? []);
      setAuthed(true);
      localStorage.setItem("shrinkto:adminToken", tok);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch("/api/partners/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error();
      await load(token);
    } catch {
      setError("Action failed.");
    } finally {
      setBusyId("");
    }
  }

  if (!authed) {
    return (
      <div className={styles.gate}>
        <h1 className={styles.h1}>Partner admin</h1>
        <p className={styles.gateText}>Enter your admin token to review applications.</p>
        <form
          className={styles.gateForm}
          onSubmit={(e) => {
            e.preventDefault();
            if (token) load(token);
          }}
        >
          <label className="sr-only" htmlFor="admin-token">Admin token</label>
          <input
            id="admin-token"
            type="password"
            className={styles.input}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin token"
            autoComplete="off"
          />
          <Button type="submit" disabled={loading || !token}>
            {loading ? <Loader2 size={18} className={styles.spin} aria-hidden /> : "Unlock"}
          </Button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    );
  }

  const pending = partners.filter((p) => p.status === "pending");
  const others = partners.filter((p) => p.status !== "pending");

  return (
    <div>
      <div className={styles.topbar}>
        <h1 className={styles.h1}>Partner applications</h1>
        <Button variant="ghost" size="sm" onClick={() => load(token)} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}

      <h2 className={styles.section}>Pending ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className={styles.muted}>No pending applications.</p>
      ) : (
        <div className={styles.list}>
          {pending.map((p) => (
            <PartnerRow key={p.id} p={p} busy={busyId === p.id} onAct={act} showActions />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <>
          <h2 className={styles.section}>Reviewed ({others.length})</h2>
          <div className={styles.list}>
            {others.map((p) => (
              <PartnerRow key={p.id} p={p} busy={busyId === p.id} onAct={act} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PartnerRow({
  p,
  busy,
  onAct,
  showActions,
}: {
  p: Partner;
  busy: boolean;
  onAct: (id: string, action: "approve" | "reject") => void;
  showActions?: boolean;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.logoWrap}>
        {p.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.logo} alt="" className={styles.logo} />
        ) : (
          <span className={styles.logoFallback} aria-hidden>{p.brandName.charAt(0)}</span>
        )}
      </div>
      <div className={styles.info}>
        <p className={styles.name}>
          {p.brandName}
          <span className={`${styles.badge} ${styles[p.status]}`}>{p.status}</span>
        </p>
        <a href={p.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {p.website} <ExternalLink size={12} aria-hidden />
        </a>
        <p className={styles.desc}>{p.description}</p>
      </div>
      {showActions && (
        <div className={styles.actions}>
          <button className={styles.approve} onClick={() => onAct(p.id, "approve")} disabled={busy} aria-label={`Approve ${p.brandName}`}>
            <Check size={16} aria-hidden /> Approve
          </button>
          <button className={styles.reject} onClick={() => onAct(p.id, "reject")} disabled={busy} aria-label={`Reject ${p.brandName}`}>
            <X size={16} aria-hidden /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
