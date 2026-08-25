"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatStatusLabel } from "@/lib/format";
import { useToast } from "@/components/toast/toast-provider";
import { updateTaskStatusAction } from "@/app/(dashboard)/tasks/actions";
import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";

export type KanbanTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  project: {
    name: string;
    client: {
      name: string;
    };
  };
};

const KANBAN_COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  URGENT: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10",
  HIGH: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/10",
  MEDIUM: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10",
  LOW: "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10",
};

export function KanbanBoard({
  initialTasks,
}: {
  initialTasks: KanbanTask[];
}) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleMoveTask = async (taskId: string, targetStatus: TaskStatus) => {
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === targetStatus) {
      setDraggingTaskId(null);
      setDragOverColumn(null);
      return;
    }

    const previousTasks = [...tasks];

    // Atualização otimista imediata
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: targetStatus } : task
      )
    );
    setDraggingTaskId(null);
    setDragOverColumn(null);

    startTransition(async () => {
      try {
        await updateTaskStatusAction(taskId, targetStatus);
        showToast(`Demanda movida para "${formatStatusLabel(targetStatus)}"`);
      } catch (error) {
        setTasks(previousTasks);
        showToast("Não foi possível atualizar a demanda. Tente novamente.", "error");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 mt-6">
      {KANBAN_COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const isColumnOver = dragOverColumn === status;

        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverColumn !== status) {
                setDragOverColumn(status);
              }
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOverColumn(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
              if (taskId) {
                handleMoveTask(taskId, status);
              }
            }}
            className={`flex flex-col rounded-xl bg-gray-50/80 p-4 border transition-all duration-200 min-h-[500px] ${
              isColumnOver
                ? "border-black bg-gray-100/90 shadow-md ring-2 ring-black/10"
                : "border-gray-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    status === "TODO"
                      ? "bg-gray-400"
                      : status === "IN_PROGRESS"
                      ? "bg-blue-500"
                      : status === "IN_REVIEW"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                <h3 className="text-sm font-semibold text-gray-900">
                  {formatStatusLabel(status)}
                </h3>
              </div>
              <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-700 shadow-2xs">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[640px] pr-1 pb-4">
              {columnTasks.length === 0 ? (
                <div
                  className={`rounded-lg border-2 border-dashed p-6 text-center text-xs transition-colors ${
                    isColumnOver
                      ? "border-black bg-white text-gray-900 font-medium"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {isColumnOver ? "Solte aqui para mover" : "Nenhuma demanda nesta etapa"}
                </div>
              ) : (
                columnTasks.map((task) => {
                  const isDragging = draggingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable={!isPending}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", task.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingTaskId(task.id);
                      }}
                      onDragEnd={() => {
                        setDraggingTaskId(null);
                        setDragOverColumn(null);
                      }}
                      className={`group relative rounded-xl border border-gray-200 bg-white p-4 shadow-2xs transition-all duration-200 select-none cursor-grab active:cursor-grabbing hover:border-gray-300 hover:shadow-md ${
                        isDragging ? "opacity-40 scale-98 border-dashed border-gray-400" : "opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                          {task.title}
                        </h4>
                        <span className="shrink-0 cursor-grab text-gray-400 group-hover:text-gray-600 text-xs select-none" title="Arraste para mover">
                          ⋮⋮
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-gray-500 truncate">
                        {task.project.name} · <span className="font-medium text-gray-700">{task.project.client.name}</span>
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.LOW
                          }`}
                        >
                          {formatStatusLabel(task.priority)}
                        </span>

                        {task.dueDate && (
                          <span className="text-[10px] text-gray-500 font-medium">
                            📅 {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
                        <select
                          value={task.status}
                          disabled={isPending}
                          onChange={(e) => handleMoveTask(task.id, e.target.value as TaskStatus)}
                          className="rounded border-none bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 focus:ring-1 focus:ring-black cursor-pointer"
                          title="Mudar status rapidamente"
                        >
                          {KANBAN_COLUMNS.map((col) => (
                            <option key={col} value={col}>
                              Mover para: {formatStatusLabel(col)}
                            </option>
                          ))}
                        </select>

                        <Link
                          href={`/tasks/${task.id}/edit`}
                          className="font-semibold text-gray-700 hover:text-black hover:underline"
                        >
                          Editar →
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
