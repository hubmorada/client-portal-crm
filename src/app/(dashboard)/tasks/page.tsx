import Link from "next/link";
import { getCurrentUserOrganization } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatStatusLabel } from "@/lib/format";
import { PAGE_SIZE, getOffset, getTotalPages, parseSearchParam, type RawSearchParams } from "@/lib/list-params";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteTaskAction } from "./actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PencilIcon } from "@/components/ui/icons";
import { SearchFilterBar } from "@/components/list/search-filter-bar";
import { Pagination } from "@/components/list/pagination";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  RecordCardList,
  RecordCard,
  RecordCardField,
  RecordCardActions,
} from "@/components/ui/record-list";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/validation/task";
import { parseTaskListParams, buildTaskWhere, buildTaskOrderBy } from "./query";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Mais recentes" },
  { value: "createdAt:asc", label: "Mais antigos" },
  { value: "dueDate:asc", label: "Prazo (mais próximo)" },
  { value: "dueDate:desc", label: "Prazo (mais distante)" },
];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { organizationId } = await getCurrentUserOrganization();
  const resolvedSearchParams = await searchParams;
  const listParams = parseTaskListParams(resolvedSearchParams);
  const view = parseSearchParam(resolvedSearchParams.view) || "list";

  const where = buildTaskWhere(organizationId, listParams);
  const orderBy = buildTaskOrderBy(listParams);

  const [projectCount, [tasks, total], kanbanTasks] = await Promise.all([
    prisma.project.count({ where: { organizationId } }),
    prisma.$transaction([
      prisma.task.findMany({
        where,
        orderBy,
        skip: getOffset(listParams.page),
        take: PAGE_SIZE,
        include: {
          project: { select: { name: true, client: { select: { name: true } } } },
        },
      }),
      prisma.task.count({ where }),
    ]),
    prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { name: true, client: { select: { name: true } } } },
      },
    }),
  ]);

  const totalPages = getTotalPages(total);
  const hasActiveParams = Boolean(
    listParams.q || listParams.status || listParams.priority,
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Demandas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {total} {total === 1 ? "demanda" : "demandas"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md shadow-sm">
            <Link
              href={{ pathname: "/tasks", query: { ...resolvedSearchParams, view: "list" } }}
              className={`rounded-l-md px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${
                view === "list"
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Lista
            </Link>
            <Link
              href={{ pathname: "/tasks", query: { ...resolvedSearchParams, view: "kanban" } }}
              className={`rounded-r-md px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${
                view === "kanban"
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Kanban
            </Link>
          </div>

          {projectCount > 0 && (
            <Link
              href="/tasks/new"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Nova demanda
            </Link>
          )}
        </div>
      </div>

      {projectCount > 0 && (
        <SearchFilterBar
          basePath="/tasks"
          searchValue={listParams.q}
          searchPlaceholder="Buscar por título ou projeto"
          filters={[
            {
              name: "status",
              label: "Status",
              value: listParams.status ?? "",
              options: [
                { value: "", label: "Todos os status" },
                ...TASK_STATUSES.map((status) => ({
                  value: status,
                  label: formatStatusLabel(status),
                })),
              ],
            },
            {
              name: "priority",
              label: "Prioridade",
              value: listParams.priority ?? "",
              options: [
                { value: "", label: "Todas as prioridades" },
                ...TASK_PRIORITIES.map((priority) => ({
                  value: priority,
                  label: formatStatusLabel(priority),
                })),
              ],
            },
          ]}
          sort={{ value: listParams.sortCombined, options: SORT_OPTIONS }}
          hasActiveParams={hasActiveParams}
        />
      )}

      {total === 0 ? (
        projectCount === 0 ? (
          <EmptyState
            title="Você precisa criar um projeto primeiro"
            description="Demandas pertencem a um projeto. Cadastre um projeto antes de criar demandas."
            action={
              <Link
                href="/projects/new"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Criar projeto
              </Link>
            }
          />
        ) : hasActiveParams ? (
          <EmptyState
            title="Nenhuma demanda encontrada"
            description="Tente um termo de busca diferente ou limpe os filtros."
            action={
              <Link
                href="/tasks"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Limpar filtros
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Nenhuma demanda cadastrada"
            description="Demandas organizam as entregas do projeto em tarefas claras com prazos e status."
            action={
              <Link
                href="/tasks/new"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Criar primeira demanda
              </Link>
            }
          />
        )
      ) : view === "kanban" ? (
        <KanbanBoard initialTasks={kanbanTasks} />
      ) : (
        <>
          <div className="hidden xl:block">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Título</TableHeaderCell>
                  <TableHeaderCell>Projeto</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Prioridade</TableHeaderCell>
                  <TableHeaderCell>Prazo</TableHeaderCell>
                  <TableHeaderCell>Concluído em</TableHeaderCell>
                  <TableHeaderCell>Criado em</TableHeaderCell>
                  <TableHeaderCell align="right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell emphasis>{task.title}</TableCell>
                    <TableCell>{task.project.name}</TableCell>
                    <TableCell>{task.project.client.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.priority} />
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? task.dueDate.toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      {task.completedAt
                        ? task.completedAt.toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>{task.createdAt.toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/tasks/${task.id}/edit`}
                          className="inline-flex items-center gap-1 rounded text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                        <DeleteButton
                          action={deleteTaskAction.bind(null, task.id)}
                          itemName={task.title}
                          confirmTitle="Excluir demanda"
                          confirmDescription={`Excluir "${task.title}"? Esta ação não pode ser desfeita.`}
                          successMessage="Demanda excluída"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <RecordCardList>
            {tasks.map((task) => (
              <RecordCard key={task.id}>
                <RecordCardField label="Título" value={task.title} emphasis />
                <RecordCardField label="Projeto" value={task.project.name} />
                <RecordCardField label="Cliente" value={task.project.client.name} />
                <RecordCardField label="Status" value={<StatusBadge status={task.status} />} />
                <RecordCardField label="Prioridade" value={<StatusBadge status={task.priority} />} />
                <RecordCardField
                  label="Prazo"
                  value={task.dueDate ? task.dueDate.toLocaleDateString("pt-BR") : "—"}
                />
                <RecordCardField
                  label="Concluído em"
                  value={task.completedAt ? task.completedAt.toLocaleDateString("pt-BR") : "—"}
                />
                <RecordCardField label="Criado em" value={task.createdAt.toLocaleDateString("pt-BR")} />
                <RecordCardActions>
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="inline-flex items-center gap-1 rounded text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                  <DeleteButton
                    action={deleteTaskAction.bind(null, task.id)}
                    itemName={task.title}
                    confirmTitle="Excluir demanda"
                    confirmDescription={`Excluir "${task.title}"? Esta ação não pode ser desfeita.`}
                    successMessage="Demanda excluída"
                  />
                </RecordCardActions>
              </RecordCard>
            ))}
          </RecordCardList>

          <Pagination
            basePath="/tasks"
            params={{
              ...(listParams.q ? { q: listParams.q } : {}),
              ...(listParams.status ? { status: listParams.status } : {}),
              ...(listParams.priority ? { priority: listParams.priority } : {}),
              sort: listParams.sortCombined,
            }}
            page={listParams.page}
            totalPages={totalPages}
          />
        </>
      )}
    </div>
  );
}
