"use client";

import { usePathname } from "next/navigation";

export function LoginVideoBackground() {
  if (usePathname() !== "/login") return null;

  return (
    <div className="site-video-background" aria-hidden="true">
      <video autoPlay muted loop playsInline preload="auto">
        <source src="/campus-background.mp4" type="video/mp4" />
      </video>
      <div className="site-video-overlay" />
    </div>
  );
}
