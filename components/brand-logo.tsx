"use client";

import { useState } from "react";
import { BRAND_ASSETS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BrandLogo({ brand, className }: { brand: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const asset = BRAND_ASSETS[brand];

  if (!asset?.logoImage || failed) {
    return <span className={cn("text-xs font-semibold tracking-[0.14em] text-neutral-700", className)}>{asset?.logo || brand}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset.logoImage}
      alt={`${asset.englishName || brand} logo`}
      onError={() => setFailed(true)}
      className={cn("h-5 max-w-[160px] object-contain", className)}
    />
  );
}
