"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPortalUser } from "@/lib/current-portal-user";
import { parseTaskForm } from "@/lib/validation/task";
import { withToast } from "@/lib/toast-url";
import { createActivity } from "@/lib/activity/create-activity";
import { buildTaskMetadata } from "@/lib/activity/task-metadata";
import type { TaskFormState } from "@/types";

export async function createPortalTaskAction(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const { values, fieldErrors } = parseTaskForm(formData);

  // O cliente pode opcionalmente atribuir um executor da agência (Pedro, etc.).
  const assigneeId = String(formData.get("assigneeId") ?? "").trim() || null;

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  const identity = await getCurrentPortalUser();
  const { clientId, organizationId } = identity;

  // Verifica se o projeto pertence de fato ao clientId do PortalUser.
  const project = await prisma.project.findFirst({
    where: { id: values.projectId, clientId },
    select: { id: true, name: true },
  });

  if (!project) {
    return {
      error: null,
      fieldErrors: { projectId: "Select a valid project." },
    };
  }

  // Verifica se o assigneeId (se fornecido) pertence à mesma organização.
  if (assigneeId) {
    const membership = await prisma.membership.findFirst({
      where: { userId: assigneeId, organizationId },
      select: { id: true },
    });
    if (!membership) {
      return {
        error: null,
        fieldErrors: { assigneeId: "Select a valid team member." },
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        title: values.title,
        description: values.description,
        status: "TODO", // Nova demanda sempre começa como TODO (ou NEW se mudarmos)
        priority: values.priority,
        dueDate: values.dueDate,
        projectId: values.projectId,
        assigneeId,
        organizationId,
        createdByPortalUserId: identity.portalUser.id,
      },
    });

    await createActivity(tx, {
      organizationId,
      actorId: null, // actorId no Activity é User (staff). Como é um PortalUser, fica null
      entityType: "TASK",
      entityId: task.id,
      action: "CREATED",
      metadata: buildTaskMetadata(task, project.name, identity.portalUser.name),
    });
  });

  redirect(withToast(`/portal/projects/${project.id}`, "Demand created"));
}
