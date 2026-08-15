import { BUILDER_CREDIT } from "@/lib/constants";

export function BuilderCredit({ className = "" }: { className?: string }) {
  return <p className={`text-xs text-neutral-400 dark:text-neutral-600 ${className}`}>{BUILDER_CREDIT}</p>;
}
