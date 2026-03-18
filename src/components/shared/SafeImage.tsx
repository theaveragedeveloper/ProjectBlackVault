"use client";

import { useState, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";

type SafeImageSource = ImageProps["src"] | null | undefined;

interface SafeImageProps extends Omit<ImageProps, "src" | "alt"> {
  src?: SafeImageSource;
  alt: string;
  fallback: ReactNode;
}

function sourceKey(src: SafeImageSource): string | null {
  if (!src) return null;
  if (typeof src === "string") return src;
  return (src as { src?: string }).src ?? null;
}

export function SafeImage({ src, fallback, onError, alt, ...imageProps }: SafeImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const currentSource = sourceKey(src);

  if (!currentSource || failedSource === currentSource) {
    return <>{fallback}</>;
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 bg-vault-border/30 animate-pulse rounded" />
      )}
      <Image
        {...imageProps}
        src={src as ImageProps["src"]}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={(event) => {
          setFailedSource(currentSource);
          onError?.(event);
        }}
      />
    </>
  );
}
