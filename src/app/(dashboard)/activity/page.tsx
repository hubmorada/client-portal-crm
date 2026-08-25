import Link from "next/link";
import { getCurrentUserOrganization } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { formatActivity, type ActivityDisplayModel } from "@/lib/activity/format-activity";
import { encodeActivityCursor } from "@/lib/activity/cursor";
import { ActivityFilterBar } from "@/components/activity/activity-filter-bar";
import { LoadMoreLink } from "@/components/activity/load-more-link";
import {
  ACTIVITY_PAGE_SIZE,
  parseActivityListParams,
  buildActivityWhere,
  dateInputValue,
} from "./query";
import type { RawSearchParams } from "@/lib/list-params";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { organizationId } = await getCurrentUserOrganization();
  const resolvedSearchParams = await searchParams;
  const listParams = parseActivityListParams(resolvedSearchParams);

  const where = buildActivityWhere(organizationId, listParams);

  // The actor dropdown is built only from this organization's own current
  // members — never from an arbitrary/global user list.
  const [rows, memberships] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: ACTIVITY_PAGE_SIZE + 1,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.membership.findMany({
      where: { organizationId },
      select: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const hasMore = rows.length > ACTIVITY_PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, ACTIVITY_PAGE_SIZE) : rows;
  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && lastRow
      ? encodeActivityCursor({ createdAt: lastRow.createdAt.toISOString(), id: lastRow.id })
      : null;

  const items: { id: string; display: ActivityDisplayModel }[] = pageRows.map((row) => ({
    id: row.id,
    display: formatActivity({
      entityType: row.entityType,
      action: row.action,
      metadata: row.metadata,
      actor: row.actor,
      createdAt: row.createdAt,
    }),
  }));

  const groups: { label: string; items: typeof items }[] = [];
  for (const item of items) {
    const label = item.display.timestamp.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  const hasActiveFilters = Boolean(
    listParams.entityType ||
      listParams.actionGroup ||
      listParams.actorId ||
      listParams.dateFrom ||
      listParams.dateTo,
  );

  const activeFilterParams: Record<string, string> = {
    ...(listParams.entityType ? { entityType: listParams.entityType } : {}),
    ...(listParams.actionGroup ? { actionGroup: listParams.actionGroup } : {}),
    ...(listParams.actorId ? { actorId: listParams.actorId } : {}),
    ...(listParams.dateFrom ? { dateFrom: dateInputValue(listParams.dateFrom) } : {}),
    ...(listParams.dateTo ? { dateTo: dateInputValue(listParams.dateTo) } : {}),
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Histórico de Atividades</h1>
      <p className="mt-1 text-sm text-gray-600">
        Registro completo de todas as alterações e ações na sua organização.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        As atividades são registradas em tempo real a cada ação da equipe.
      </p>

      <ActivityFilterBar
        entityType={listParams.entityType ?? ""}
        actionGroup={listParams.actionGroup ?? ""}
        actorId={listParams.actorId ?? ""}
        dateFrom={dateInputValue(listParams.dateFrom)}
        dateTo={dateInputValue(listParams.dateTo)}
        members={memberships.map((m) => m.user)}
        hasActiveFilters={hasActiveFilters}
      />

      {listParams.cursorInvalid && (
        <p role="alert" className="mt-4 text-sm text-amber-700">
          O link da página expirou — exibindo as atividades mais recentes.
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "Nenhuma atividade encontrada" : "Nenhuma atividade recente"}
          description={
            hasActiveFilters
              ? "Tente filtros diferentes ou limpe os filtros para ver tudo."
              : "As ações realizadas pela sua equipe aparecerão aqui em tempo real."
          }
          action={
            hasActiveFilters ? (
              <Link
                href="/activity"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Limpar filtros
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="text-sm font-semibold capitalize text-gray-500">{group.label}</h2>
              <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {group.items.map((item) => (
                  <li key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{item.display.actorLabel}</span>{" "}
                        {item.display.actionLabel}
                        {item.display.isDeleted && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            Excluído
                          </span>
                        )}
                      </p>
                      <time
                        dateTime={item.display.timestamp.toISOString()}
                        className="shrink-0 text-xs text-gray-400"
                      >
                        {item.display.timestamp.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    {item.display.detailLines.map((line, index) => (
                      <p key={index} className="mt-1 text-xs text-gray-500">
                        {line}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <LoadMoreLink basePath="/activity" params={activeFilterParams} cursor={nextCursor} />
        </div>
      )}
    </div>
  );
}
