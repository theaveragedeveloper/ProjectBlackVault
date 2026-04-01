"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  subtitle: string;
  url: string;
}

interface SearchResults {
  firearms: SearchResult[];
  accessories: SearchResult[];
  ammo: SearchResult[];
  builds: SearchResult[];
}

const EMPTY: SearchResults = { firearms: [], accessories: [], ammo: [], builds: [] };
const CATEGORIES: { key: keyof SearchResults; label: string }[] = [
  { key: "firearms", label: "FIREARMS" },
  { key: "accessories", label: "ACCESSORIES" },
  { key: "ammo", label: "AMMO" },
  { key: "builds", label: "BUILDS" },
];

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for open event from nav buttons
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("bv:search:open", handler);
    return () => window.removeEventListener("bv:search:open", handler);
  }, []);

  // Auto-focus when opened
  useEffect(() => {
    if (open) {
      setQ("");
      setResults(EMPTY);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults(EMPTY);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQ(val);
    search(val);
  }

  function handleNavigate(url: string) {
    router.push(url);
    setOpen(false);
  }

  const hasResults = CATEGORIES.some((c) => results[c.key].length > 0);
  const showEmpty = q.length >= 2 && !loading && !hasResults;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col bg-vault-bg/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-vault-border bg-vault-surface shrink-0">
        <Search className="w-5 h-5 text-vault-text-muted shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={handleChange}
          placeholder="Search firearms, accessories, ammo…"
          className="flex-1 bg-transparent text-vault-text text-sm placeholder-vault-text-faint outline-none"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              setResults(EMPTY);
            }}
            className="text-vault-text-faint hover:text-vault-text"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setOpen(false)}
          className="text-vault-text-muted hover:text-vault-text text-xs"
        >
          Esc
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-4">
        {!q && (
          <p className="text-xs text-vault-text-faint text-center mt-8">
            Search your entire armory
          </p>
        )}
        {showEmpty && (
          <p className="text-xs text-vault-text-faint text-center mt-8">
            No results found for &ldquo;{q}&rdquo;
          </p>
        )}
        {CATEGORIES.map(({ key, label }) => {
          const items = results[key];
          if (items.length === 0) return null;
          return (
            <div key={key} className="mb-4">
              <p className="text-[10px] font-semibold tracking-widest text-vault-text-muted uppercase mb-1.5">
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.url)}
                    className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-vault-surface border border-transparent hover:border-vault-border transition-colors"
                  >
                    <span className="text-sm text-vault-text">{item.name}</span>
                    <span className="text-xs text-vault-text-muted">{item.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
