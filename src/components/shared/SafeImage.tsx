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
  const currentSource = sourceKey(src);

  if (!currentSource || failedSource === currentSource) {
    return <>{fallback}</>;
  }

  return (
    <Image
      {...imageProps}
      src={src as ImageProps["src"]}
      alt={alt}
      onError={(event) => {
        setFailedSource(currentSource);
        onError?.(event);
      }}
    />
  );
}
