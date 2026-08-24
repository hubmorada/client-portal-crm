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
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/validation/task";
import { parseTaskListParams, buildTaskWhere, buildTaskOrderBy } from "./query";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "dueDate:asc", label: "Due date (soonest)" },
  { value: "dueDate:desc", label: "Due date (latest)" },
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

  const columns = {
    TODO: kanbanTasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: kanbanTasks.filter((t) => t.status === "IN_PROGRESS"),
    IN_REVIEW: kanbanTasks.filter((t) => t.status === "IN_REVIEW"),
    DONE: kanbanTasks.filter((t) => t.status === "DONE"),
  };
  const hasActiveParams = Boolean(
    listParams.q || listParams.status || listParams.priority,
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {total} {total === 1 ? "task" : "tasks"}
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
              List
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
              Add task
            </Link>
          )}
        </div>
      </div>

      {projectCount > 0 && (
        <SearchFilterBar
          basePath="/tasks"
          searchValue={listParams.q}
          searchPlaceholder="Search by title or project"
          filters={[
            {
              name: "status",
              label: "Status",
              value: listParams.status ?? "",
              options: [
                { value: "", label: "All statuses" },
                ...TASK_STATUSES.map((status) => ({
                  value: status,
                  label: formatStatusLabel(status),
                })),
              ],
            },
            {
              name: "priority",
              label: "Priority",
              value: listParams.priority ?? "",
              options: [
                { value: "", label: "All priorities" },
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
            title="You need a project first"
            description="Tasks must belong to a project. Add one before creating a task."
            action={
              <Link
                href="/projects/new"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Add project
              </Link>
            }
          />
        ) : hasActiveParams ? (
          <EmptyState
            title="No matching tasks"
            description="Try a different search term or clear your filters."
            action={
              <Link
                href="/tasks"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="No tasks yet"
            description="Tasks break a project down into the specific work you need to track and complete."
            action={
              <Link
                href="/tasks/new"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Create your first task
              </Link>
            }
          />
        )
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 mt-6">
          {(Object.keys(columns) as Array<keyof typeof columns>).map((status) => {
            const statusTasks = columns[status];
            return (
              <div key={status} className="flex flex-col rounded-lg bg-gray-50 p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {formatStatusLabel(status)}
                  </h3>
                  <span className="inline-flex items-center rounded-md bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {statusTasks.length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {statusTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
                      No tasks
                    </div>
                  ) : (
                    statusTasks.map((task) => (
                      <div key={task.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {task.title}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500 truncate">
                          {task.project.name} · {task.project.client.name}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${
                            task.priority === "URGENT" ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10" :
                            task.priority === "HIGH" ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/10" :
                            task.priority === "MEDIUM" ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10" :
                            "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10"
                          }`}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-gray-500">
                              {task.dueDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
                          <Link
                            href={`/tasks/${task.id}/edit`}
                            className="text-xs font-semibold text-gray-700 hover:text-black hover:underline"
                          >
                            Edit →
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="hidden xl:block">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Title</TableHeaderCell>
                  <TableHeaderCell>Project</TableHeaderCell>
                  <TableHeaderCell>Client</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Priority</TableHeaderCell>
                  <TableHeaderCell>Due date</TableHeaderCell>
                  <TableHeaderCell>Completed</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableHeaderCell align="right">Actions</TableHeaderCell>
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
                      {task.dueDate ? task.dueDate.toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      {task.completedAt
                        ? task.completedAt.toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>{task.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/tasks/${task.id}/edit`}
                          className="inline-flex items-center gap-1 rounded text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <DeleteButton
                          action={deleteTaskAction.bind(null, task.id)}
                          itemName={task.title}
                          confirmTitle="Delete task"
                          confirmDescription={`Delete "${task.title}"? This action cannot be undone.`}
                          successMessage="Task deleted"
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
                <RecordCardField label="Title" value={task.title} emphasis />
                <RecordCardField label="Project" value={task.project.name} />
                <RecordCardField label="Client" value={task.project.client.name} />
                <RecordCardField label="Status" value={<StatusBadge status={task.status} />} />
                <RecordCardField label="Priority" value={<StatusBadge status={task.priority} />} />
                <RecordCardField
                  label="Due date"
                  value={task.dueDate ? task.dueDate.toLocaleDateString() : "—"}
                />
                <RecordCardField
                  label="Completed"
                  value={task.completedAt ? task.completedAt.toLocaleDateString() : "—"}
                />
                <RecordCardField label="Created" value={task.createdAt.toLocaleDateString()} />
                <RecordCardActions>
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="inline-flex items-center gap-1 rounded text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <DeleteButton
                    action={deleteTaskAction.bind(null, task.id)}
                    itemName={task.title}
                    confirmTitle="Delete task"
                    confirmDescription={`Delete "${task.title}"? This action cannot be undone.`}
                    successMessage="Task deleted"
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
