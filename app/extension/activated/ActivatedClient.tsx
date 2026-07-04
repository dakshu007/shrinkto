"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, Check, AlertCircle, Loader2 } from "@/components/icons";
import styles from "./activated.module.css";

type Phase = "loading" | "ready" | "activated" | "error";

/** Chrome's extension messaging API, present when the extension is installed. */
interface ChromeRuntime {
  runtime?: {
    sendMessage: (
      extensionId: string,
      message: unknown,
      callback: (response?: { ok?: boolean; error?: string }) => void,
    ) => void;
    lastError?: { message?: string };
  };
}

export function ActivatedClient() {
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>("loading");
  const [licenseKey, setLicenseKey] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const paymentId = params.get("payment_id") ?? "";
  const status = params.get("status") ?? "";
  const extId = params.get("ext") ?? "";
  const mode = params.get("mode") === "test" ? "test" : "live";

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Some processors append the key directly - use it if present.
      const direct = params.get("license_key");
      if (direct) {
        if (!cancelled) {
          setLicenseKey(direct);
          setPhase("ready");
        }
        return;
      }
      if (!paymentId) {
        setPhase("error");
        setMessage("Missing payment reference. Your license key is in your purchase email.");
        return;
      }
      try {
        const res = await fetch(
          `/api/extension/license?payment_id=${encodeURIComponent(paymentId)}&mode=${mode}`,
        );
        const body = (await res.json()) as { key?: string; error?: string };
        if (cancelled) return;
        if (res.ok && body.key) {
          setLicenseKey(body.key);
          setPhase("ready");
        } else {
          setPhase("error");
          setMessage(body.error ?? "Couldn't fetch your license key. It's also in your purchase email.");
        }
      } catch {
        if (!cancelled) {
          setPhase("error");
          setMessage("Couldn't fetch your license key. It's also in your purchase email.");
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, mode]);

  // Once we have the key, hand it to the extension for automatic activation.
  useEffect(() => {
    if (phase !== "ready" || !licenseKey || !extId) return;
    const cr = (window as unknown as { chrome?: ChromeRuntime }).chrome;
    if (!cr?.runtime?.sendMessage) return;
    try {
      cr.runtime.sendMessage(
        extId,
        { type: "activate-license", key: licenseKey, testMode: mode === "test" },
        (response) => {
          if (cr.runtime?.lastError) return; // extension not reachable - manual path stays
          if (response?.ok) setPhase("activated");
        },
      );
    } catch {
      /* extension not installed in this browser - manual activation below */
    }
  }, [phase, licenseKey, extId, mode]);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {status && status !== "succeeded" && status !== "processing" ? (
          <>
            <AlertCircle size={40} className={styles.warnIcon} aria-hidden />
            <h1>Payment not completed</h1>
            <p className={styles.sub}>
              Your payment status is “{status}”. If you were charged, contact us and we&apos;ll sort
              it out immediately.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 size={40} className={styles.okIcon} aria-hidden />
            <h1>{phase === "activated" ? "You're all set!" : "Thanks for your purchase!"}</h1>

            {phase === "loading" && (
              <p className={styles.sub}>
                <Loader2 size={16} className={styles.spin} aria-hidden /> Fetching your license key…
              </p>
            )}

            {(phase === "ready" || phase === "activated") && (
              <>
                <p className={styles.sub}>
                  {phase === "activated"
                    ? "ShrinkTo Pro is activated in your browser. This key is yours for life - it's also in your email."
                    : "Here is your lifetime license key (also sent to your email):"}
                </p>
                <div className={styles.keyBox}>
                  <code>{licenseKey}</code>
                  <button onClick={copyKey} aria-label="Copy license key">
                    {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                  </button>
                </div>
                {phase === "ready" && (
                  <ol className={styles.steps}>
                    <li>Click the ShrinkTo Pro icon in your browser toolbar</li>
                    <li>Paste the key under “already purchased?”</li>
                    <li>Hit Activate - done, forever</li>
                  </ol>
                )}
                {phase === "activated" && (
                  <p className={styles.activatedNote}>
                    <Check size={15} aria-hidden /> Activated automatically - open the extension and
                    start compressing.
                  </p>
                )}
              </>
            )}

            {phase === "error" && (
              <>
                <p className={styles.subError}>{message}</p>
                <p className={styles.sub}>
                  Open the email receipt from Dodo Payments - your license key is inside. Paste it
                  into the extension under “already purchased?”.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
