import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AutoSubmitSelect } from "@/components/list/auto-submit-select";
import { formatStatusLabel } from "@/lib/format";
import { ACTIVITY_ENTITY_TYPES } from "@/app/(dashboard)/activity/query";

type Member = { id: string; name: string; email: string };

const ACTION_GROUP_OPTIONS = [
  { value: "data", label: "Alterações de dados" },
  { value: "invitations", label: "Convites" },
  { value: "team", label: "Equipe" },
];

export function ActivityFilterBar({
  entityType,
  actionGroup,
  actorId,
  dateFrom,
  dateTo,
  members,
  hasActiveFilters,
}: {
  entityType: string;
  actionGroup: string;
  actorId: string;
  dateFrom: string;
  dateTo: string;
  members: Member[];
  hasActiveFilters: boolean;
}) {
  return (
    <form
      method="GET"
      action="/activity"
      className="mt-6 flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4"
    >
      <div className="w-40">
        <label htmlFor="entityType" className="block text-sm font-medium text-gray-700">
          Entidade
        </label>
        <AutoSubmitSelect id="entityType" name="entityType" defaultValue={entityType}>
          <option value="">Todas as entidades</option>
          {ACTIVITY_ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatStatusLabel(type)}
            </option>
          ))}
        </AutoSubmitSelect>
      </div>

      <div className="w-44">
        <label htmlFor="actionGroup" className="block text-sm font-medium text-gray-700">
          Categoria
        </label>
        <AutoSubmitSelect id="actionGroup" name="actionGroup" defaultValue={actionGroup}>
          <option value="">Todas as categorias</option>
          {ACTION_GROUP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AutoSubmitSelect>
      </div>

      <div className="w-52">
        <label htmlFor="actorId" className="block text-sm font-medium text-gray-700">
          Membro
        </label>
        <AutoSubmitSelect id="actorId" name="actorId" defaultValue={actorId}>
          <option value="">Todos os membros</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </AutoSubmitSelect>
      </div>

      <div className="w-40">
        <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
          De
        </label>
        <Input id="dateFrom" name="dateFrom" type="date" defaultValue={dateFrom} />
      </div>

      <div className="w-40">
        <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">
          Até
        </label>
        <Input id="dateTo" name="dateTo" type="date" defaultValue={dateTo} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Filtrar</Button>
        {hasActiveFilters && (
          <Link
            href="/activity"
            className="rounded text-sm text-gray-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            Limpar
          </Link>
        )}
      </div>
    </form>
  );
}
