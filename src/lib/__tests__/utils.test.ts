import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateInput,
  roundsLabel,
  stockStatus,
} from "../utils";

describe("formatCurrency", () => {
  it("formats a positive number as USD by default", () => {
    expect(formatCurrency(1500)).toBe("$1,500");
  });

  it("formats a decimal value", () => {
    expect(formatCurrency(9.99)).toBe("$9.99");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("returns '—' for null", () => {
    expect(formatCurrency(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(formatCurrency(undefined)).toBe("—");
  });

  it("respects a custom currency", () => {
    const result = formatCurrency(100, "EUR");
    expect(result).toContain("100");
    expect(result).toMatch(/€|EUR/);
  });
});

describe("formatNumber", () => {
  it("formats a large number with commas", () => {
    expect(formatNumber(1000000)).toBe("1,000,000");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("returns '—' for null", () => {
    expect(formatNumber(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(formatNumber(undefined)).toBe("—");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2024-06-15T00:00:00Z"));
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
  });

  it("formats an ISO date string", () => {
    const result = formatDate("2023-01-01T00:00:00Z");
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2023/);
  });

  it("returns '—' for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("formatDateInput", () => {
  it("returns YYYY-MM-DD format", () => {
    expect(formatDateInput("2024-03-15T10:30:00Z")).toBe("2024-03-15");
  });

  it("returns empty string for null", () => {
    expect(formatDateInput(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDateInput(undefined)).toBe("");
  });
});

describe("roundsLabel", () => {
  it("returns plain count for values under 1000", () => {
    expect(roundsLabel(500)).toBe("500 rds");
  });

  it("formats thousands with K", () => {
    expect(roundsLabel(1500)).toBe("1.5K rds");
  });

  it("formats millions with M", () => {
    expect(roundsLabel(2000000)).toBe("2.0M rds");
  });

  it("handles exactly 1000", () => {
    expect(roundsLabel(1000)).toBe("1.0K rds");
  });

  it("handles exactly 1,000,000", () => {
    expect(roundsLabel(1000000)).toBe("1.0M rds");
  });
});

describe("stockStatus", () => {
  it("returns 'empty' when quantity is 0", () => {
    expect(stockStatus(0)).toBe("empty");
    expect(stockStatus(0, 50)).toBe("empty");
  });

  it("returns 'ok' when no low alert is set", () => {
    expect(stockStatus(100)).toBe("ok");
  });

  it("returns 'ok' when quantity is above the alert threshold", () => {
    expect(stockStatus(200, 100)).toBe("ok");
  });

  it("returns 'low' when quantity is at or below the alert threshold", () => {
    expect(stockStatus(100, 100)).toBe("low");
    expect(stockStatus(80, 100)).toBe("low");
  });

  it("returns 'critical' when quantity is at or below half the alert threshold", () => {
    expect(stockStatus(50, 100)).toBe("critical");
    expect(stockStatus(30, 100)).toBe("critical");
  });
});
