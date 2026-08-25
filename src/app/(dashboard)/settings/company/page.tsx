import { getCurrentMembership } from "@/lib/current-user";
import { getCompanyProfile } from "@/lib/organization-setup/company-profile";
import { canManageCompanyProfile } from "@/lib/organization-setup/authorization";
import { getSupportedCurrencies, getSupportedTimezones } from "@/lib/validation/company-profile";
import { CompanyProfileForm } from "./company-profile-form";
import { LogoUploadForm } from "./logo-upload-form";

export default async function CompanyProfilePage() {
  const { organizationId, membership } = await getCurrentMembership();
  const profile = await getCompanyProfile(organizationId);
  const canManage = canManageCompanyProfile(membership.role);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Perfil da Empresa</h1>
      <p className="mt-1 text-sm text-gray-500">Configure os dados da sua agência — dados cadastrais, contato, endereço, CNPJ e identidade visual.</p>

      {canManage ? (
        <>
          <CompanyProfileForm profile={profile} currencies={getSupportedCurrencies()} timezones={getSupportedTimezones()} />
          <LogoUploadForm currentLogoUrl={profile.logoUrl} />
        </>
      ) : (
        <div className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">Apenas o proprietário ou administradores podem alterar os dados da empresa.</p>
          {profile.logoUrl && (
            <div>
              <p className="text-xs font-medium text-gray-500">Logotipo</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.logoUrl}
                alt="Logotipo da organização"
                className="mt-1 h-20 w-20 rounded-md border border-gray-200 object-contain"
              />
            </div>
          )}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Nome fantasia</dt>
              <dd className="text-sm text-gray-900">{profile.displayName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Razão social</dt>
              <dd className="text-sm text-gray-900">{profile.legalName ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Moeda</dt>
              <dd className="text-sm text-gray-900">{profile.currency ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Fuso horário</dt>
              <dd className="text-sm text-gray-900">{profile.timezone ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">E-mail de suporte</dt>
              <dd className="text-sm text-gray-900">{profile.supportEmail ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Site oficial</dt>
              <dd className="text-sm text-gray-900">{profile.website ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Telefone / WhatsApp</dt>
              <dd className="text-sm text-gray-900">{profile.phone ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">País</dt>
              <dd className="text-sm text-gray-900">{profile.country ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Logradouro</dt>
              <dd className="text-sm text-gray-900">{profile.streetAddress ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Cidade</dt>
              <dd className="text-sm text-gray-900">{profile.city ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Estado (UF)</dt>
              <dd className="text-sm text-gray-900">{profile.state ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">CEP</dt>
              <dd className="text-sm text-gray-900">{profile.postalCode ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">CNPJ / CPF</dt>
              <dd className="text-sm text-gray-900">{profile.taxId ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Cor da marca</dt>
              <dd className="text-sm text-gray-900">{profile.brandColor ?? "Não informado"}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
