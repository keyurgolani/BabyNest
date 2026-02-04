"use client";

import { useState, useRef, useEffect } from "react";
import { Icons } from "@/components/icons";

interface HeroCardProps {
  /** URL of the avatar image */
  photoUrl?: string | null;
  /** Name to display as alt text */
  name?: string;
  /** Fallback avatar URL when no photo is set */
  fallbackUrl?: string;
  /** Whether to show edit overlay when no photo is set */
  showEditOverlay?: boolean;
  /** Callback when avatar is clicked (only fires when no photo is set and showEditOverlay is true) */
  onEditClick?: () => void;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * HeroCard component with parallax tilt effect and glass ring styling.
 * 
 * Features:
 * - Parallax tilt effect on mouse move (GPU-accelerated with transform3d)
 * - Glass ring styling around avatar (border-white/20, ring-primary/20)
 * - Glow effect that shifts with the tilt
 * - Support for click to edit when no photo is set
 * - Respects prefers-reduced-motion for accessibility
 * 
 * @validates Requirement 12.1: THE Dashboard SHALL display a hero avatar with parallax tilt effect and glass ring
 * @validates Requirement 20.6: THE application SHALL support prefers-reduced-motion media query
 */
export function HeroCard({
  photoUrl,
  name = "Baby",
  fallbackUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Baby",
  showEditOverlay = true,
  onEditClick,
  className = "",
}: HeroCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Check for prefers-reduced-motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReducedMotion !== mediaQuery.matches) {
      // eslint-disable-next-line
      setPrefersReducedMotion(mediaQuery.matches);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [prefersReducedMotion]);

  // Handle parallax tilt effect (disabled when prefers-reduced-motion is set)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current || prefersReducedMotion) return;
    
    const rect = heroRef.current.getBoundingClientRect();
    // Calculate position relative to center (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Max tilt of 10 degrees for subtle effect
    const maxTilt = 10;
    const tiltX = y * maxTilt;
    const tiltY = -x * maxTilt;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    // Smoothly reset tilt to zero
    setTilt({ x: 0, y: 0 });
  };

  const handleClick = () => {
    if (!photoUrl && showEditOverlay && onEditClick) {
      onEditClick();
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = fallbackUrl;
  };

  const isClickable = !photoUrl && showEditOverlay && onEditClick;

  // Calculate glow offset based on tilt (shifts opposite to tilt direction)
  const glowOffsetX = prefersReducedMotion ? 0 : -tilt.y * 0.5;
  const glowOffsetY = prefersReducedMotion ? 0 : -tilt.x * 0.5;
  const glowIntensity = prefersReducedMotion ? 0.3 : Math.min(0.6, 0.3 + (Math.abs(tilt.x) + Math.abs(tilt.y)) * 0.02);

  return (
    <div
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative ${isClickable ? "cursor-pointer" : ""} group ${className}`}
      style={{ perspective: "1000px" }}
      title={isClickable ? "Click to add profile photo" : undefined}
    >
      {/* Avatar container with glass ring styling and GPU-accelerated transforms */}
      <div
        className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white/20 shadow-lg relative ring-2 ring-primary/20 will-change-transform"
        style={{
          transform: prefersReducedMotion 
            ? "translate3d(0, 0, 0)" 
            : `translate3d(0, 0, 0) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.15s ease-out",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl || fallbackUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
        {/* Edit overlay on hover - only show when no photo and edit is enabled */}
        {!photoUrl && showEditOverlay && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Icons.Edit className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      {/* Glow effect that shifts with the tilt */}
      <div
        className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10 will-change-transform"
        style={{
          opacity: glowIntensity,
          transform: `translate3d(${glowOffsetX}px, ${glowOffsetY}px, 0)`,
          transition: "opacity 0.2s ease-out, transform 0.15s ease-out",
        }}
      />
    </div>
  );
}
