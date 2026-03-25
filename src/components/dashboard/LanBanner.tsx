"use client";

import { useState, useEffect } from "react";

export function LanBanner() {
  const [url, setUrl] = useState<string>("");
  const [dismissed, setDismissed] = useState(true); // true = hidden until mounted

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("bv-lan-banner-dismissed") === "1";
    if (isDismissed) return;

    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return;

    fetch("/api/network/local-access")
      .then((r) => r.json())
      .then((data) => {
        const lanUrl = data?.url as string | null;
        if (lanUrl) {
          setUrl(lanUrl);
          setDismissed(false);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("bv-lan-banner-dismissed", "1");
    setDismissed(true);
  };

  const copy = () => navigator.clipboard.writeText(url).catch(() => {});

  if (dismissed || !url) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-sm mb-4">
      <span className="text-vault-text">
        📱 Open on your phone:{" "}
        <span className="font-mono text-[#00C2FF]">{url}</span>
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={copy} className="text-xs text-[#00C2FF] hover:underline">
          Copy
        </button>
        <button
          onClick={dismiss}
          className="text-vault-text-faint hover:text-vault-text text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
