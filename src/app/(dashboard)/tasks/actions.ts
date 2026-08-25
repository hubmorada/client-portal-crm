"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrganization } from "@/lib/current-user";
import { createActivity } from "@/lib/activity/create-activity";
import { buildTaskMetadata, buildTaskStatusChangedMetadata } from "@/lib/activity/task-metadata";
import { deriveCompletedAt } from "@/lib/validation/task";
import type { TaskStatus } from "@/generated/prisma/enums";

export async function updateTaskStatusAction(taskId: string, newStatus: TaskStatus) {
  const { user, organizationId } = await getCurrentUserOrganization();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.task.findFirst({
      where: { id: taskId, project: { organizationId } },
      include: { project: { select: { name: true } } },
    });

    if (!existing) {
      throw new Error("Demanda não encontrada.");
    }

    if (existing.status === newStatus) {
      return;
    }

    await tx.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedAt: deriveCompletedAt(newStatus, existing.completedAt),
      },
    });

    await createActivity(tx, {
      organizationId,
      actorId: user.id,
      entityType: "TASK",
      entityId: taskId,
      action: "STATUS_CHANGED",
      metadata: buildTaskStatusChangedMetadata(
        existing,
        existing.project.name,
        existing.status,
        newStatus,
        user.name,
      ),
    });
  });

  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTaskAction(taskId: string) {
  const { user, organizationId } = await getCurrentUserOrganization();

  // Delete and its Activity row are one atomic unit — a failed Activity
  // insert rolls the delete back too.
  await prisma.$transaction(async (tx) => {
    // Snapshot taken before deletion — Activity.entityId is not a foreign
    // key, so this row (and its metadata) is what keeps the entry readable
    // once the Task row itself is gone.
    const existing = await tx.task.findFirst({
      where: { id: taskId, project: { organizationId } },
      include: { project: { select: { name: true } } },
    });

    if (!existing) {
      return;
    }

    const result = await tx.task.deleteMany({
      where: { id: taskId, project: { organizationId } },
    });

    if (result.count === 0) {
      return;
    }

    await createActivity(tx, {
      organizationId,
      actorId: user.id,
      entityType: "TASK",
      entityId: taskId,
      action: "DELETED",
      metadata: buildTaskMetadata(existing, existing.project.name, user.name),
    });
  });

  revalidatePath("/tasks");
}
