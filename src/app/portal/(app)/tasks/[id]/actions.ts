"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPortalUser } from "@/lib/current-portal-user";
import { prisma } from "@/lib/prisma";
import { createPortalCommentForEntity } from "@/lib/comments/create-comment";
import { uploadAttachmentForEntity, deleteAttachmentForEntity } from "@/lib/attachments/attachment-mutations";
import type { CommentActionState, AttachmentUploadState } from "@/types";

export async function createPortalTaskCommentAction(
  taskId: string,
  _prevState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const rawBody = String(formData.get("body") ?? "");

  const result = await createPortalCommentForEntity({
    entityType: "TASK",
    entityId: taskId,
    rawBody,
  });

  if (result.ok) {
    revalidatePath(`/portal/tasks/${taskId}`);
    return { error: null };
  }

  const errorMap = {
    rate_limited: "You are commenting too fast. Please wait.",
    not_found: "Demand not found.",
    empty_body: "Comment cannot be empty.",
    body_too_long: "Comment is too long (maximum 1000 characters).",
  };

  return { error: errorMap[result.error] ?? "Failed to save comment." };
}

export async function uploadPortalTaskAttachmentAction(
  taskId: string,
  _prevState: AttachmentUploadState,
  formData: FormData,
): Promise<AttachmentUploadState> {
  const identity = await getCurrentPortalUser();
  const { clientId, organizationId, portalUser } = identity;

  // Autenticação robusta: garante que a task pertence a um projeto do cliente ativo.
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { clientId } },
    select: { id: true, title: true },
  });

  if (!task) {
    return { error: "Demand not found." };
  }

  const result = await uploadAttachmentForEntity({
    organizationId,
    actorId: null,
    actorName: portalUser.name,
    entityType: "TASK",
    entityId: taskId,
    parentEntityLabel: task.title,
    formData,
  });

  if (result.error === null) {
    revalidatePath(`/portal/tasks/${taskId}`);
  }

  return result;
}

export async function deletePortalTaskAttachmentAction(
  taskId: string,
  attachmentId: string,
): Promise<void> {
  const identity = await getCurrentPortalUser();
  const { clientId, organizationId, portalUser } = identity;

  // Autenticação robusta.
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { clientId } },
    select: { id: true },
  });

  if (!task) {
    return;
  }

  await deleteAttachmentForEntity({
    organizationId,
    actorId: null,
    actorName: portalUser.name,
    attachmentId,
    entityType: "TASK",
    resolveParentLabel: async () => {
      const t = await prisma.task.findUnique({
        where: { id: taskId },
        select: { title: true },
      });
      return t?.title ?? null;
    },
  });

  revalidatePath(`/portal/tasks/${taskId}`);
}
