import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentPortalUser } from "@/lib/current-portal-user";
import { getPortalTask } from "@/lib/client-portal/tasks";
import { getPortalTaskAttachments } from "@/lib/client-portal/attachments";
import { StatusBadge } from "@/components/ui/status-badge";
import { CommentsSection } from "@/components/comments/comments-section";
import { PortalAttachmentsList } from "@/components/client-portal/portal-attachments-list";
import { AttachmentUploadForm } from "@/components/attachments/attachment-upload-form";
import { parseSearchParam, type RawSearchParams } from "@/lib/list-params";
import {
  createPortalTaskCommentAction,
  uploadPortalTaskAttachmentAction,
  deletePortalTaskAttachmentAction,
} from "./actions";

export default async function PortalTaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const identity = await getCurrentPortalUser();
  const { clientId, organizationId } = identity;

  const task = await getPortalTask(clientId, id);

  if (!task) {
    notFound();
  }

  const attachments = await getPortalTaskAttachments({
    id: task.id,
    title: task.title,
    organizationId,
  });

  const commentsCursor = parseSearchParam(resolvedSearchParams.commentsCursor) || undefined;

  const boundUploadAction = uploadPortalTaskAttachmentAction.bind(null, task.id);
  const boundDeleteAttachmentAction = async (attachmentId: string) => {
    "use server";
    await deletePortalTaskAttachmentAction(task.id, attachmentId);
  };

  const boundCreateCommentAction = createPortalTaskCommentAction.bind(null, task.id);
  const dummyEditCommentAction = (commentId: string) => {
    return async () => {
      "use server";
      return { error: "Editing comments is not supported in client portal." };
    };
  };
  const dummyDeleteCommentAction = (commentId: string) => {
    return async () => {
      "use server";
    };
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/portal/tasks"
        className="rounded text-sm text-gray-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        ← Back to demands
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              {task.title}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Project: <span className="font-medium">{task.projectName}</span>
            </p>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {task.description && (
          <p className="mt-4 text-sm text-gray-600">{task.description}</p>
        )}

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Priority
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                task.priority === "URGENT" ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10" :
                task.priority === "HIGH" ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/10" :
                task.priority === "MEDIUM" ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10" :
                "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10"
              }`}>
                {task.priority}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Due date
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {task.dueDate ? task.dueDate.toLocaleDateString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Assignee
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {task.assigneeName ?? "Unassigned"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
        <div className="mb-6">
          <AttachmentUploadForm action={boundUploadAction} />
        </div>
        <PortalAttachmentsList
          attachments={attachments}
          emptyDescription="No files attached to this demand."
          onDelete={boundDeleteAttachmentAction}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CommentsSection
          entityType="TASK"
          entityId={task.id}
          organizationId={organizationId}
          currentUserId={identity.portalUser.id}
          isModerator={false}
          parentLabel="demand"
          basePath={`/portal/tasks/${task.id}`}
          cursorParam="commentsCursor"
          cursor={commentsCursor}
          createAction={boundCreateCommentAction}
          makeEditAction={dummyEditCommentAction}
          makeDeleteAction={dummyDeleteCommentAction}
        />
      </div>
    </div>
  );
}
