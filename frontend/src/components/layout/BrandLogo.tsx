"use client";

import { useState } from "react";
import Image from "next/image";

interface BrandLogoProps {
  src?: string;
  className?: string;
}

export function BrandLogo({
  src = "/brand_logo.svg",
  className = "",
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`text-lg font-bold text-white ${className}`}>
        Nigertoday TV
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt="Nigertoday TV"
      width={160}
      height={40}
      priority
      onError={() => setFailed(true)}
      className={`h-9 w-auto ${className}`}
    />
  );
}