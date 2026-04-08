"use client";

import Image, { type StaticImageData } from "next/image";

import facebookLogo from "../../../../asset/facebook.svg";
import instagramLogo from "../../../../asset/instagram.svg";
import tiktokLogo from "../../../../asset/tiktok.svg";
import xLogo from "../../../../asset/x.svg";
import youtubeLogo from "../../../../asset/youtube.svg";
import type { ContentPlatform } from "../types/content.type";

const PLATFORM_LOGO_MAP: Record<ContentPlatform, { src: StaticImageData; alt: string }> = {
  instagram: { src: instagramLogo, alt: "Instagram" },
  tiktok: { src: tiktokLogo, alt: "TikTok" },
  youtube: { src: youtubeLogo, alt: "YouTube" },
  facebook: { src: facebookLogo, alt: "Facebook" },
  x: { src: xLogo, alt: "X" },
};

interface PlatformLogoProps {
  platform: ContentPlatform;
  className?: string;
}

export function PlatformLogo({ platform, className }: PlatformLogoProps) {
  const logo = PLATFORM_LOGO_MAP[platform];

  return <Image src={logo.src} alt={logo.alt} width={18} height={18} className={className} unoptimized />;
}
