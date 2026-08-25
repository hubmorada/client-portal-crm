import type { TimeRange } from "@/lib/analytics/types";
import { AnalyticsRangeSelector } from "./analytics-range-selector";

export function AnalyticsHeader({ selected }: { selected: TimeRange }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Métricas &amp; Desempenho</h1>
        <p className="mt-1 text-sm text-gray-500">Acompanhe a evolução de clientes, demandas e entregas.</p>
      </div>
      <AnalyticsRangeSelector selected={selected} />
    </div>
  );
}
