"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PumpingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/log/feed?type=pumping");
  }, [router]);

  return null;
}
