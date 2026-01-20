"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SolidsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/log/feed?type=solid");
  }, [router]);

  return null;
}
