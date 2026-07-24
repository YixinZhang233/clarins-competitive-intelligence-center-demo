"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND_ASSETS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BrandVisual({
  brand,
  src,
  alt,
  className,
  imageClassName
}: {
  brand: string;
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const asset = BRAND_ASSETS[brand];
  const imageSrc = src || asset?.visual;

  return (
    <div className={cn("relative overflow-hidden bg-neutral-100", className)}>
      {!failed && imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt || `${brand} brand visual`}
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-white via-neutral-50 to-neutral-200 p-6 text-center">
          <div>
            <div className="flex justify-center">
              <BrandLogo brand={brand} className="h-7 max-w-[220px]" />
            </div>
            <p className="mt-3 text-sm font-semibold text-neutral-500">{asset?.englishName || brand}</p>
            <p className="mt-1 text-sm text-neutral-500">{brand}</p>
          </div>
        </div>
      )}
    </div>
  );
}
