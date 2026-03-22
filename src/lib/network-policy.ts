function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true";
}

export function allowExternalImageUrls(): boolean {
  return readBooleanEnv("ALLOW_EXTERNAL_IMAGE_URLS", true);
}

export function allowImageSearchEgress(): boolean {
  return readBooleanEnv("ALLOW_IMAGE_SEARCH_EGRESS", false);
}
