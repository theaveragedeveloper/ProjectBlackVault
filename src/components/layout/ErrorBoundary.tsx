"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-svh bg-[#0d0d0d] px-6"
          style={{ backgroundColor: "#0d0d0d" }}
        >
          {/* Shield-X icon */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-6"
          >
            <path
              d="M16 2 L28 7 L28 16 C28 23 22 29 16 31 C10 29 4 23 4 16 L4 7 Z"
              fill="#1a1a1a"
              stroke="#E53935"
              strokeWidth="1.5"
            />
            <line
              x1="12"
              y1="12"
              x2="20"
              y2="20"
              stroke="#E53935"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="20"
              y1="12"
              x2="12"
              y2="20"
              stroke="#E53935"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <h1
            className="text-xl font-semibold mb-2"
            style={{ color: "#f0f0f0" }}
          >
            Something went wrong
          </h1>

          <p
            className="text-sm text-center mb-8 max-w-xs"
            style={{ color: "#888888" }}
          >
            An unexpected error occurred. Try reloading the page.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "#00C2FF",
              color: "#0d0d0d",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
