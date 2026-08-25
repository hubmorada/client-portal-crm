import Link from "next/link";
import { getCurrentUserOrganization } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatStatusLabel } from "@/lib/format";
import { PAGE_SIZE, getOffset, getTotalPages, type RawSearchParams } from "@/lib/list-params";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteProjectAction } from "./actions";
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
import { PROJECT_STATUSES } from "@/lib/validation/project";
import {
  parseProjectListParams,
  buildProjectWhere,
  buildProjectOrderBy,
} from "./query";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Mais recentes" },
  { value: "createdAt:asc", label: "Mais antigos" },
  { value: "name:asc", label: "Nome (A–Z)" },
  { value: "name:desc", label: "Nome (Z–A)" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { organizationId } = await getCurrentUserOrganization();
  const resolvedSearchParams = await searchParams;
  const listParams = parseProjectListParams(resolvedSearchParams);

  const where = buildProjectWhere(organizationId, listParams);
  const orderBy = buildProjectOrderBy(listParams);

  const [clientCount, [projects, total]] = await Promise.all([
    prisma.client.count({ where: { organizationId } }),
    prisma.$transaction([
      prisma.project.findMany({
        where,
        orderBy,
        skip: getOffset(listParams.page),
        take: PAGE_SIZE,
        include: { client: { select: { name: true } } },
      }),
      prisma.project.count({ where }),
    ]),
  ]);

  const totalPages = getTotalPages(total);
  const hasActiveParams = Boolean(listParams.q || listParams.status);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Projetos
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {total} {total === 1 ? "projeto" : "projetos"}
          </p>
        </div>
        {clientCount > 0 && (
          <Link
            href="/projects/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            Novo projeto
          </Link>
        )}
      </div>

      {clientCount > 0 && (
        <SearchFilterBar
          basePath="/projects"
          searchValue={listParams.q}
          searchPlaceholder="Buscar por nome ou cliente"
          filters={[
            {
              name: "status",
              label: "Status",
              value: listParams.status ?? "",
              options: [
                { value: "", label: "Todos os status" },
                ...PROJECT_STATUSES.map((status) => ({
                  value: status,
                  label: formatStatusLabel(status),
                })),
              ],
            },
          ]}
          sort={{ value: listParams.sortCombined, options: SORT_OPTIONS }}
          hasActiveParams={hasActiveParams}
        />
      )}

      {total === 0 ? (
        clientCount === 0 ? (
          <EmptyState
            title="Você precisa de um cliente primeiro"
            description="Projetos são vinculados a clientes. Adicione seu primeiro cliente antes de criar projetos."
            action={
              <Link
                href="/clients/new"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Cadastrar cliente
              </Link>
            }
          />
        ) : hasActiveParams ? (
          <EmptyState
            title="Nenhum projeto encontrado"
            description="Tente um termo de busca diferente ou limpe seus filtros."
            action={
              <Link
                href="/projects"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Limpar filtros
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Nenhum projeto cadastrado"
            description="Projetos organizam as entregas do seu cliente em um fluxo estruturado de demandas."
            action={
              <Link
                href="/projects/new"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Criar primeiro projeto
              </Link>
            }
          />
        )
      ) : (
        <>
          <div className="hidden xl:block">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Data de início</TableHeaderCell>
                  <TableHeaderCell>Data de término</TableHeaderCell>
                  <TableHeaderCell>Criado em</TableHeaderCell>
                  <TableHeaderCell align="right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell emphasis>{project.name}</TableCell>
                    <TableCell>{project.client.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell>
                      {project.startDate
                        ? project.startDate.toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {project.endDate
                        ? project.endDate.toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>{project.createdAt.toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/projects/${project.id}/edit`}
                          className="inline-flex items-center gap-1 rounded text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                        <DeleteButton
                          action={deleteProjectAction.bind(null, project.id)}
                          itemName={project.name}
                          confirmTitle="Excluir projeto"
                          confirmDescription={`Excluir ${project.name}? Esta ação não pode ser desfeita.`}
                          successMessage="Projeto excluído"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <RecordCardList>
            {projects.map((project) => (
              <RecordCard key={project.id}>
                <RecordCardField label="Nome" value={project.name} emphasis />
                <RecordCardField label="Cliente" value={project.client.name} />
                <RecordCardField label="Status" value={<StatusBadge status={project.status} />} />
                <RecordCardField
                  label="Data de início"
                  value={project.startDate ? project.startDate.toLocaleDateString("pt-BR") : "—"}
                />
                <RecordCardField
                  label="Data de término"
                  value={project.endDate ? project.endDate.toLocaleDateString("pt-BR") : "—"}
                />
                <RecordCardField label="Criado em" value={project.createdAt.toLocaleDateString("pt-BR")} />
                <RecordCardActions>
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="inline-flex items-center gap-1 rounded text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                  <DeleteButton
                    action={deleteProjectAction.bind(null, project.id)}
                    itemName={project.name}
                    confirmTitle="Excluir projeto"
                    confirmDescription={`Excluir ${project.name}? Esta ação não pode ser desfeita.`}
                    successMessage="Projeto excluído"
                  />
                </RecordCardActions>
              </RecordCard>
            ))}
          </RecordCardList>

          <Pagination
            basePath="/projects"
            params={{
              ...(listParams.q ? { q: listParams.q } : {}),
              ...(listParams.status ? { status: listParams.status } : {}),
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
