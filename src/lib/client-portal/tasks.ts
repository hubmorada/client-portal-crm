import { prisma } from "@/lib/prisma";
import type { TaskStatus, TaskPriority } from "@/generated/prisma/enums";

export type PortalTaskSummary = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  projectName: string;
  projectId: string;
  assigneeName: string | null;
};

/**
 * Retorna todas as demandas (Tasks) de todos os projetos vinculados ao clientId.
 */
export async function getPortalTasks(clientId: string): Promise<PortalTaskSummary[]> {
  const tasks = await prisma.task.findMany({
    where: {
      project: {
        clientId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      project: { select: { name: true, id: true } },
      assignee: { select: { name: true } },
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    completedAt: t.completedAt,
    createdAt: t.createdAt,
    projectName: t.project.name,
    projectId: t.project.id,
    assigneeName: t.assignee?.name ?? null,
  }));
}

/**
 * Retorna os detalhes de uma demanda (Task) se ela pertencer a um projeto do clientId.
 */
export async function getPortalTask(
  clientId: string,
  taskId: string,
): Promise<PortalTaskSummary | null> {
  const t = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        clientId,
      },
    },
    include: {
      project: { select: { name: true, id: true } },
      assignee: { select: { name: true } },
    },
  });

  if (!t) return null;

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    completedAt: t.completedAt,
    createdAt: t.createdAt,
    projectName: t.project.name,
    projectId: t.project.id,
    assigneeName: t.assignee?.name ?? null,
  };
}

/**
 * Retorna as demandas (Tasks) de um projeto específico se ele pertencer ao clientId.
 */
export async function getPortalProjectTasks(
  clientId: string,
  projectId: string,
): Promise<PortalTaskSummary[]> {
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      project: {
        clientId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      project: { select: { name: true, id: true } },
      assignee: { select: { name: true } },
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    completedAt: t.completedAt,
    createdAt: t.createdAt,
    projectName: t.project.name,
    projectId: t.project.id,
    assigneeName: t.assignee?.name ?? null,
  }));
}
