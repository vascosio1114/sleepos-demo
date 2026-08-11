import type { WellnessStatus } from "@/lib/demo-data";

export function StatusPill({ status, label }: { status: WellnessStatus; label: string }) {
  return <span className="status-pill" data-status={status}><span aria-hidden="true" />{label}</span>;
}
