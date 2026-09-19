import { cn } from "@/utils/cn";

/**
 * Lazy-loaded image. Uploaded images are downscaled in the browser before they
 * are stored, so a plain <img> with lazy loading is enough (no optimiser needed).
 */
export function SmartImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={cn("object-cover", className)} />;
}
