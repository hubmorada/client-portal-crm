"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { TASK_PRIORITIES } from "@/lib/validation/task";
import type { TaskFormState } from "@/types";

const initialState: TaskFormState = { error: null };

export function PortalTaskForm({
  action,
  projects,
  assignees,
  defaultValues,
  submitLabel = "Create demand",
  pendingLabel = "Creating…",
}: {
  action: (
    prevState: TaskFormState,
    formData: FormData,
  ) => Promise<TaskFormState>;
  projects: { id: string; label: string }[];
  assignees: { id: string; name: string }[];
  defaultValues?: {
    title?: string;
    description?: string;
    projectId?: string;
    priority?: string;
    dueDate?: string;
    assigneeId?: string;
  };
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="Title" htmlFor="title" required error={state.fieldErrors?.title}>
        <Input
          id="title"
          name="title"
          defaultValue={defaultValues?.title}
          required
          aria-invalid={!!state.fieldErrors?.title}
          aria-describedby={state.fieldErrors?.title ? "title-error" : undefined}
        />
      </FormField>

      <FormField label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Describe your demand here..."
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Project"
          htmlFor="projectId"
          required
          error={state.fieldErrors?.projectId}
        >
          <Select
            id="projectId"
            name="projectId"
            defaultValue={defaultValues?.projectId ?? ""}
            required
            aria-invalid={!!state.fieldErrors?.projectId}
            aria-describedby={
              state.fieldErrors?.projectId ? "projectId-error" : undefined
            }
          >
            <option value="" disabled>
              Select a project
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Priority"
          htmlFor="priority"
          error={state.fieldErrors?.priority}
        >
          <Select
            id="priority"
            name="priority"
            defaultValue={defaultValues?.priority ?? "MEDIUM"}
            aria-invalid={!!state.fieldErrors?.priority}
            aria-describedby={
              state.fieldErrors?.priority ? "priority-error" : undefined
            }
          >
            {TASK_PRIORITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Due date"
          htmlFor="dueDate"
          error={state.fieldErrors?.dueDate}
        >
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaultValues?.dueDate ?? ""}
            aria-invalid={!!state.fieldErrors?.dueDate}
            aria-describedby={
              state.fieldErrors?.dueDate ? "dueDate-error" : undefined
            }
          />
        </FormField>

        <FormField
          label="Assignee (Who should execute)"
          htmlFor="assigneeId"
          error={state.fieldErrors?.assigneeId}
        >
          <Select
            id="assigneeId"
            name="assigneeId"
            defaultValue={defaultValues?.assigneeId ?? ""}
            aria-invalid={!!state.fieldErrors?.assigneeId}
            aria-describedby={
              state.fieldErrors?.assigneeId ? "assigneeId-error" : undefined
            }
          >
            <option value="">
              Auto-assign (Agency Admin)
            </option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
