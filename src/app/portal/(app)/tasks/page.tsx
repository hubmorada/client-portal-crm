import Link from "next/link";
import { getCurrentPortalUser } from "@/lib/current-portal-user";
import { getPortalTasks } from "@/lib/client-portal/tasks";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatStatusLabel } from "@/lib/format";

export default async function PortalTasksPage() {
  const { clientId } = await getCurrentPortalUser();
  const tasks = await getPortalTasks(clientId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Demandas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Acompanhe o status e solicite novas demandas para seus projetos.
          </p>
        </div>
        <Link
          href="/portal/tasks/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          + Nova Demanda
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            Nenhuma demanda encontrada. Clique no botão acima para criar sua primeira solicitação.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Projeto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Prazo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.projectName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        task.priority === "URGENT" ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10" :
                        task.priority === "HIGH" ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/10" :
                        task.priority === "MEDIUM" ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10" :
                        "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10"
                      }`}>
                        {formatStatusLabel(task.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.dueDate ? task.dueDate.toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.assigneeName ?? "Não atribuído"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
