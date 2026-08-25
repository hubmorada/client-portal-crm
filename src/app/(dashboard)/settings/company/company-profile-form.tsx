"use client";

import { useActionState } from "react";
import { updateCompanyProfileAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import type { CompanyProfileFormState } from "@/types";
import type { CompanyProfileData } from "@/lib/organization-setup/company-profile";

const initialState: CompanyProfileFormState = { error: null };

export function CompanyProfileForm({
  profile,
  currencies,
  timezones,
}: {
  profile: CompanyProfileData;
  currencies: readonly string[];
  timezones: readonly string[];
}) {
  const [state, formAction, pending] = useActionState(updateCompanyProfileAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-8 rounded-lg border border-gray-200 bg-white p-6">
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-gray-900">Dados da Empresa</legend>

        <FormField label="Nome fantasia / Marca" htmlFor="displayName" required error={state.fieldErrors?.displayName}>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={profile.displayName}
            aria-invalid={!!state.fieldErrors?.displayName}
            required
          />
        </FormField>

        <FormField label="Razão social" htmlFor="legalName" required error={state.fieldErrors?.legalName}>
          <Input
            id="legalName"
            name="legalName"
            type="text"
            defaultValue={profile.legalName ?? ""}
            aria-invalid={!!state.fieldErrors?.legalName}
            required
          />
        </FormField>

        <FormField label="Moeda principal" htmlFor="currency" required error={state.fieldErrors?.currency}>
          <Select
            id="currency"
            name="currency"
            defaultValue={profile.currency ?? "BRL"}
            aria-invalid={!!state.fieldErrors?.currency}
            required
          >
            <option value="" disabled>
              Selecione uma moeda
            </option>
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Fuso horário" htmlFor="timezone" required error={state.fieldErrors?.timezone}>
          <Select
            id="timezone"
            name="timezone"
            defaultValue={profile.timezone ?? "America/Sao_Paulo"}
            aria-invalid={!!state.fieldErrors?.timezone}
            required
          >
            <option value="" disabled>
              Selecione um fuso horário
            </option>
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </FormField>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-gray-900">Contato &amp; Atendimento</legend>

        <FormField label="E-mail de suporte / atendimento" htmlFor="supportEmail" error={state.fieldErrors?.supportEmail}>
          <Input
            id="supportEmail"
            name="supportEmail"
            type="text"
            defaultValue={profile.supportEmail ?? ""}
            aria-invalid={!!state.fieldErrors?.supportEmail}
          />
        </FormField>

        <FormField label="Site oficial" htmlFor="website" error={state.fieldErrors?.website}>
          <Input
            id="website"
            name="website"
            type="text"
            placeholder="https://"
            defaultValue={profile.website ?? ""}
            aria-invalid={!!state.fieldErrors?.website}
          />
        </FormField>

        <FormField label="Telefone / WhatsApp" htmlFor="phone" error={state.fieldErrors?.phone}>
          <Input
            id="phone"
            name="phone"
            type="text"
            defaultValue={profile.phone ?? ""}
            aria-invalid={!!state.fieldErrors?.phone}
          />
        </FormField>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-gray-900">Endereço</legend>

        <FormField label="País" htmlFor="country" required error={state.fieldErrors?.country}>
          <Input
            id="country"
            name="country"
            type="text"
            defaultValue={profile.country ?? "Brasil"}
            aria-invalid={!!state.fieldErrors?.country}
            required
          />
        </FormField>

        <FormField label="Logradouro e número" htmlFor="streetAddress" error={state.fieldErrors?.streetAddress}>
          <Input
            id="streetAddress"
            name="streetAddress"
            type="text"
            defaultValue={profile.streetAddress ?? ""}
            aria-invalid={!!state.fieldErrors?.streetAddress}
          />
        </FormField>

        <FormField label="Cidade" htmlFor="city" error={state.fieldErrors?.city}>
          <Input
            id="city"
            name="city"
            type="text"
            defaultValue={profile.city ?? ""}
            aria-invalid={!!state.fieldErrors?.city}
          />
        </FormField>

        <FormField label="Estado (UF)" htmlFor="state" error={state.fieldErrors?.state}>
          <Input
            id="state"
            name="state"
            type="text"
            defaultValue={profile.state ?? ""}
            aria-invalid={!!state.fieldErrors?.state}
          />
        </FormField>

        <FormField label="CEP" htmlFor="postalCode" error={state.fieldErrors?.postalCode}>
          <Input
            id="postalCode"
            name="postalCode"
            type="text"
            defaultValue={profile.postalCode ?? ""}
            aria-invalid={!!state.fieldErrors?.postalCode}
          />
        </FormField>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-gray-900">Dados Fiscais</legend>

        <FormField label="CNPJ / CPF" htmlFor="taxId" error={state.fieldErrors?.taxId}>
          <Input
            id="taxId"
            name="taxId"
            type="text"
            defaultValue={profile.taxId ?? ""}
            aria-invalid={!!state.fieldErrors?.taxId}
          />
        </FormField>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-gray-900">Identidade Visual</legend>

        <FormField label="Cor principal da marca" htmlFor="brandColor" error={state.fieldErrors?.brandColor}>
          <Input
            id="brandColor"
            name="brandColor"
            type="text"
            placeholder="#000000"
            defaultValue={profile.brandColor ?? ""}
            aria-invalid={!!state.fieldErrors?.brandColor}
          />
        </FormField>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm text-green-600">
          {state.message}
        </p>
      )}

      <Button type="submit" loading={pending}>
        {pending ? "Salvando…" : "Salvar dados da empresa"}
      </Button>
    </form>
  );
}
