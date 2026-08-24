import Link from "next/link";
import { getCurrentPortalUser } from "@/lib/current-portal-user";
import { getPortalProjects } from "@/lib/client-portal/queries";
import { prisma } from "@/lib/prisma";
import { PortalTaskForm } from "@/components/client-portal/portal-task-form";
import { parseSearchParam, type RawSearchParams } from "@/lib/list-params";
import { createPortalTaskAction } from "./actions";

export default async function NewPortalTaskPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const defaultProjectId = parseSearchParam(resolvedSearchParams.projectId) || undefined;
  const { clientId, organizationId } = await getCurrentPortalUser();

  const [portalProjects, memberships] = await Promise.all([
    getPortalProjects(clientId),
    prisma.membership.findMany({
      where: { organizationId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),
  ]);

  const projects = portalProjects.map((p) => ({
    id: p.id,
    label: p.name,
  }));

  const assignees = memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/portal"
        className="rounded text-sm text-gray-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        ← Back to overview
      </Link>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">
          New Demand
        </h1>

        <PortalTaskForm
          action={createPortalTaskAction}
          projects={projects}
          assignees={assignees}
          defaultValues={{ projectId: defaultProjectId }}
        />
      </div>
    </div>
  );
}
