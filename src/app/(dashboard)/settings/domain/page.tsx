import { getCurrentUserOrganization, getCurrentMembership } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getDomainSettings, getGeneratedSubdomain } from "@/lib/organization-setup/domain-settings";
import { canManageDomainSettings } from "@/lib/organization-setup/authorization";
import { StatusBadge } from "@/components/ui/status-badge";
import { DomainSettingsForm } from "./domain-settings-form";

export default async function DomainSettingsPage() {
  const { organizationId } = await getCurrentUserOrganization();
  const { membership } = await getCurrentMembership();
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { slug: true } });
  const settings = await getDomainSettings(organizationId);
  const generatedSubdomain = getGeneratedSubdomain(organization.slug);
  const canManage = canManageDomainSettings(membership.role);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Configurações de Domínio</h1>
      <p className="mt-1 text-sm text-gray-500">
        Endereço de acesso do seu workspace e personalização de domínio para o Portal.
      </p>

      <div className="mt-6 space-y-1 rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium text-gray-500">Subdomínio padrão gerado</p>
        <p className="font-mono text-sm text-gray-900">{generatedSubdomain}</p>
      </div>

      {canManage ? (
        <DomainSettingsForm settings={settings} />
      ) : (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">Apenas o proprietário ou administradores podem alterar as configurações de domínio.</p>
          <dl className="mt-4">
            <dt className="text-xs font-medium text-gray-500">Domínio personalizado</dt>
            <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
              {settings.customDomain ? (
                <>
                  <span>{settings.customDomain}</span>
                  {settings.verificationStatus && <StatusBadge status={settings.verificationStatus} />}
                </>
              ) : (
                "Não configurado"
              )}
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}
