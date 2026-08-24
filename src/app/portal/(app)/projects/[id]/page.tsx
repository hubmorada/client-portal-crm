import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentPortalUser } from "@/lib/current-portal-user";
import { getPortalProject } from "@/lib/client-portal/queries";
import { getPortalProjectAttachments } from "@/lib/client-portal/attachments";
import { getPortalProjectTasks } from "@/lib/client-portal/tasks";
import { StatusBadge } from "@/components/ui/status-badge";
import { PortalAttachmentsList } from "@/components/client-portal/portal-attachments-list";

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clientId } = await getCurrentPortalUser();

  // Scoped by id + clientId together, never a bare id lookup — a project
  // belonging to a different Client (same organization or a different
  // one) simply doesn't match, indistinguishable from a nonexistent id.
  const project = await getPortalProject(clientId, id);

  if (!project) {
    notFound();
  }

  // The Project lookup above is already scoped by id + clientId — this
  // only re-applies the entityType/entityId/organizationId boundary on
  // the Attachment table, it does not re-verify Project ownership.
  const [attachments, tasks] = await Promise.all([
    getPortalProjectAttachments(project),
    getPortalProjectTasks(clientId, project.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/portal/projects"
        className="rounded text-sm text-gray-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        ← Back to projects
      </Link>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            {project.name}
          </h1>
          <StatusBadge status={project.status} />
        </div>

        {project.description && (
          <p className="mt-4 text-sm text-gray-600">{project.description}</p>
        )}

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Client
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{project.clientName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Start date
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {project.startDate ? project.startDate.toLocaleDateString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              End date
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {project.endDate ? project.endDate.toLocaleDateString() : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-sm font-semibold text-gray-900">Attachments</h2>
          <PortalAttachmentsList
            attachments={attachments}
            emptyDescription="Files shared for this project will appear here."
          />
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Demands</h2>
            <Link
              href={`/portal/tasks/new?projectId=${project.id}`}
              className="text-xs font-semibold text-black hover:underline"
            >
              + New Demand
            </Link>
          </div>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No demands created for this project.</p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {tasks.map((task) => (
                <li key={task.id} className="hover:bg-gray-50">
                  <Link
                    href={`/portal/tasks/${task.id}`}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Priority: {task.priority} · {task.dueDate ? `Due ${task.dueDate.toLocaleDateString()}` : "No due date"}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
