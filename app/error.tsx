"use client";

import { RecoveryCard } from "@/components/navigation/RecoveryCard";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RecoveryCard onRetry={reset} />;
}
