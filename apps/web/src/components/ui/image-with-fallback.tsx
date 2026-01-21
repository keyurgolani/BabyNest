"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  fallbackSrc?: string;
  fallbackType?: 'baby' | 'memory';
}

const DEFAULT_FALLBACKS = {
  baby: "https://api.dicebear.com/7.x/avataaars/svg?seed=Baby",
  memory: "https://api.dicebear.com/7.x/shapes/svg?seed=Memory&backgroundColor=f3f4f6",
};

export function ImageWithFallback({
  src,
  fallbackSrc,
  fallbackType = 'memory',
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const imageSrc = error || !src 
    ? (fallbackSrc || DEFAULT_FALLBACKS[fallbackType])
    : src;

  return (
    <>
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" />
      )}
      <Image
        {...props}
        src={imageSrc}
        alt={alt}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        unoptimized={imageSrc.startsWith("http")}
      />
    </>
  );
}
