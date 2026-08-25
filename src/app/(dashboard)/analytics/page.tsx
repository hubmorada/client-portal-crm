import { getCurrentMembership } from "@/lib/current-user";
import { getOrganizationAnalytics } from "@/lib/analytics/services/analytics-service";
import { AnalyticsAccessError } from "@/lib/analytics/authorization";
import { parseTimeRangeParam } from "@/lib/analytics/constants";
import { getPlan } from "@/lib/billing/plans";
import { StatusBadge } from "@/components/ui/status-badge";
import { AnalyticsHeader } from "@/components/analytics/analytics-header";
import { AnalyticsGrid } from "@/components/analytics/analytics-grid";
import { AnalyticsEmptyState } from "@/components/analytics/analytics-empty-state";
import { AnalyticsAccessDenied } from "@/components/analytics/analytics-access-denied";
import { GrowthIndicator } from "@/components/analytics/growth-indicator";
import { Sparkline } from "@/components/analytics/charts/sparkline";
import { GrowthLineChart } from "@/components/analytics/charts/growth-line-chart";
import { ActivityStackedBarChart } from "@/components/analytics/charts/activity-stacked-bar-chart";
import { ComparisonBarChart } from "@/components/analytics/charts/comparison-bar-chart";
import { ChartsSection, ChartPanel } from "@/components/analytics/charts/charts-section";
import { OrganizationActivitySection } from "@/components/analytics/charts/organization-activity-section";
import { PortalAnalyticsSection } from "@/components/analytics/charts/portal-analytics-section";

/**
 * Analytics Stage 3 (docs/analytics-architecture.md §10/§11). Authorization
 * is enforced entirely server-side by `getOrganizationAnalytics()` itself
 * (it calls `assertCanViewAnalytics()` before running any query) — this
 * page never re-implements that check, it only decides how to *render*
 * the already-server-made decision. `AnalyticsAccessError` is caught
 * here, server-side, via `instanceof` (safe: this catch runs in the same
 * process as the throw, never crosses a serialization boundary) and
 * rendered as a dedicated "Access denied" state — deliberately NOT
 * delegated to this route's `error.tsx`, since Next.js redacts Server
 * Component error messages by default in production before they'd ever
 * reach a client-side error boundary. Every other thrown error still
 * propagates to `error.tsx` normally. Client Portal identities never
 * reach this page at all: it lives under `(dashboard)`, whose layout
 * already redirects any Portal-only identity to `/portal` first.
 *
 * `range` is read from the URL (`?range=`), never a cookie; every chart
 * below is fed exclusively from `data.charts`, computed in the same
 * single `getOrganizationAnalytics()` call as every KPI card — no second
 * service call anywhere on this page, and no aggregation happens
 * client-side: charts only ever format and draw numbers this page
 * already has.
 */
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationId, membership } = await getCurrentMembership();
  const { range: rawRange } = await searchParams;
  const timeRange = parseTimeRangeParam(rawRange);

  let data;
  try {
    data = await getOrganizationAnalytics(organizationId, membership.role, timeRange);
  } catch (err) {
    if (err instanceof AnalyticsAccessError) {
      return <AnalyticsAccessDenied />;
    }
    throw err;
  }

  const isOverviewEmpty =
    data.organization.totalClients === 0 &&
    data.organization.totalProjects === 0 &&
    data.organization.totalTasks === 0 &&
    data.organization.totalInvoices === 0 &&
    data.organization.totalAttachments === 0;

  const plan = getPlan(data.billing.planKey);

  // Pure reshaping of already-fetched series (no new query, no
  // aggregation) — sparklines only need one number per bucket, not the
  // separate created/completed split the full charts below use.
  const taskCreatedSeries = { unit: data.charts.taskActivitySeries.unit, points: data.charts.taskActivitySeries.points.map((p) => ({ bucketStart: p.bucketStart, count: p.created })) };
  const invoiceCreatedSeries = { unit: data.charts.invoiceActivitySeries.unit, points: data.charts.invoiceActivitySeries.points.map((p) => ({ bucketStart: p.bucketStart, count: p.created })) };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <AnalyticsHeader selected={data.timeRange} />

      <div className="mt-6 space-y-6">
        {isOverviewEmpty ? (
          <AnalyticsEmptyState />
        ) : (
          <AnalyticsGrid
            id="analytics-overview"
            title="Visão Geral"
            metrics={[
              { label: "Clientes", value: data.organization.totalClients, sparkline: <Sparkline series={data.charts.clientGrowthSeries} /> },
              { label: "Projetos", value: data.organization.totalProjects, sparkline: <Sparkline series={data.charts.projectGrowthSeries} /> },
              { label: "Demandas", value: data.organization.totalTasks, sparkline: <Sparkline series={taskCreatedSeries} /> },
              { label: "Demandas concluídas", value: data.organization.completedTasks },
              { label: "Membros da equipe", value: data.organization.totalMembers },
              { label: "Arquivos anexados", value: data.organization.totalAttachments },
            ]}
          />
        )}

        <AnalyticsGrid
          id="analytics-activity"
          title="Atividades Recentes"
          metrics={[
            { label: "Hoje", value: data.activity.createdToday },
            { label: "Esta semana", value: data.activity.createdThisWeek },
            { label: "Este mês", value: data.activity.createdThisMonth },
          ]}
        />

        <AnalyticsGrid
          id="analytics-completion"
          title="Taxa de Conclusão"
          metrics={[
            { label: "Taxa de entrega de demandas", value: `${data.completion.taskCompletionRate}%` },
            { label: "Taxa de quitação", value: `${data.completion.invoiceCompletionRate}%` },
          ]}
        />

        <AnalyticsGrid
          id="analytics-growth"
          title="Crescimento no Período"
          metrics={[
            {
              label: "Clientes",
              value: data.growth.clientGrowth.currentPeriodCount,
              indicator: <GrowthIndicator metric={data.growth.clientGrowth} label="Crescimento de clientes" />,
            },
            {
              label: "Projetos",
              value: data.growth.projectGrowth.currentPeriodCount,
              indicator: <GrowthIndicator metric={data.growth.projectGrowth} label="Crescimento de projetos" />,
            },
            {
              label: "Demandas",
              value: data.growth.taskGrowth.currentPeriodCount,
              indicator: <GrowthIndicator metric={data.growth.taskGrowth} label="Crescimento de demandas" />,
            },
          ]}
        />

        <ChartsSection id="analytics-trends" title="Tendências de Crescimento">
          <ChartPanel title="Evolução de clientes" chart={<GrowthLineChart label="Clientes" series={data.charts.clientGrowthSeries} />} />
          <ChartPanel title="Evolução de projetos" chart={<GrowthLineChart label="Projetos" series={data.charts.projectGrowthSeries} />} />
        </ChartsSection>

        <ChartsSection id="analytics-task-invoice-activity" title="Fluxo de Demandas">
          <ChartPanel title="Demandas: criadas vs. concluídas" chart={<ActivityStackedBarChart label="Demandas" series={data.charts.taskActivitySeries} />} />
        </ChartsSection>

        <section aria-labelledby="analytics-comparison-heading" className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 id="analytics-comparison-heading" className="text-base font-semibold text-gray-900">
            Comparativo com o Período Anterior
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ComparisonBarChart label="Clientes" metric={data.growth.clientGrowth} />
            <ComparisonBarChart label="Projetos" metric={data.growth.projectGrowth} />
            <ComparisonBarChart label="Demandas" metric={data.growth.taskGrowth} />
          </div>
        </section>

        <OrganizationActivitySection
          activityEventsSeries={data.charts.activityEventsSeries}
          onboarding={data.onboarding}
          subscriptionEventCount={data.billing.subscriptionEventCount}
        />

        <PortalAnalyticsSection
          portal={data.portal}
          portalUserGrowthSeries={data.charts.portalUserGrowthSeries}
          portalInvitationSeries={data.charts.portalInvitationSeries}
        />

        <AnalyticsGrid
          id="analytics-status"
          title="Status da Organização"
          metrics={[
            { label: "Plano", value: plan.displayName },
            { label: "Status da assinatura", value: <StatusBadge status={data.billing.subscriptionStatus} /> },
            { label: "Configuração do Workspace", value: `${data.onboarding.percent}%` },
          ]}
        />
      </div>
    </div>
  );
}
