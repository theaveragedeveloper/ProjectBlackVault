export type ApiErrorResult = {
  status: number;
  error: string;
};

const STORAGE_STARTUP_PATTERNS = [
  /P1001/, // cannot reach database server
  /P1003/, // database does not exist
  /P2021/, // table does not exist
  /no such table/i,
  /unable to open database file/i,
  /SQLITE_CANTOPEN/i,
  /database is locked/i,
  /migrate/i,
];

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function toStorageStartupError(error: unknown, fallback: string): ApiErrorResult {
  const message = toErrorMessage(error);
  const isStartupIssue = STORAGE_STARTUP_PATTERNS.some((pattern) => pattern.test(message));

  if (isStartupIssue) {
    return {
      status: 503,
      error: "Vault storage is still starting. Wait 10-20 seconds, then try again.",
    };
  }

  return {
    status: 500,
    error: fallback,
  };
}
