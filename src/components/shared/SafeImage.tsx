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
  return typeof src === "string" ? src : src.src;
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
      src={src}
      alt={alt}
      onError={(event) => {
        setFailedSource(currentSource);
        onError?.(event);
      }}
    />
  );
}
