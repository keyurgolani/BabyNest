"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BottlePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/log/feed?type=bottle");
  }, [router]);

  return null;
}
