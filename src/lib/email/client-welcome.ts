import { sendEmailViaResend, type SendEmailFn } from "./resend-client";
import { buildEmailLegalFooterHtml, buildEmailLegalFooterText } from "./legal-footer";

export type SendClientWelcomeEmailParams = {
  to: string;
  clientName: string;
  companyName?: string | null;
  organizationName: string;
};

export type SendClientWelcomeEmailResult =
  | { delivered: true }
  | { delivered: false; reason: "not_configured" | "provider_error" | "network_error" };

function getAppBaseUrl(): string {
  const explicit = process.env.APP_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/+$/, "");

  return "http://localhost:3000";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHtml(params: {
  clientName: string;
  companyName?: string | null;
  organizationName: string;
  portalUrl: string;
}): string {
  const safeClient = escapeHtml(params.clientName);
  const safeOrg = escapeHtml(params.organizationName);
  const safeCompany = params.companyName ? escapeHtml(params.companyName) : null;
  const safeUrl = escapeHtml(params.portalUrl);
  const legalFooter = buildEmailLegalFooterHtml();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Portal de Demandas</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="padding: 32px 32px 16px 32px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
          Bem-vindo(a) à ${safeOrg}! 🎉
        </h1>
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Olá, <strong>${safeClient}</strong>${safeCompany ? ` (${safeCompany})` : ""},
        </p>
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          É um grande prazer ter você e sua empresa conosco! Seu cadastro foi concluído com sucesso e agora temos um canal exclusivo para o acompanhamento e gestão de todas as suas demandas e projetos.
        </p>
        <p style="font-size: 15px; color: #374151; margin: 0 0 24px 0;">
          Pelo nosso portal, você pode abrir novas solicitações de demandas, acompanhar o andamento em tempo real, anexar arquivos e interagir diretamente com nossa equipe.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 24px 0;">
          <tr>
            <td align="center">
              <a href="${safeUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                Acessar Portal do Cliente
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size: 13px; color: #6b7280; margin: 0;">
          Se precisar de qualquer suporte ou tiver dúvidas, nossa equipe está à total disposição.
        </p>
      </td>
    </tr>
    ${legalFooter}
  </table>
</body>
</html>`;
}

function renderText(params: {
  clientName: string;
  companyName?: string | null;
  organizationName: string;
  portalUrl: string;
}): string {
  const legalFooter = buildEmailLegalFooterText();

  return `Bem-vindo(a) à ${params.organizationName}! 🎉

Olá, ${params.clientName}${params.companyName ? ` (${params.companyName})` : ""},

É um grande prazer ter você e sua empresa conosco! Seu cadastro foi concluído com sucesso e agora temos um canal exclusivo para o acompanhamento e gestão de todas as suas demandas e projetos.

Pelo nosso portal, você pode abrir novas solicitações de demandas, acompanhar o andamento em tempo real, anexar arquivos e interagir diretamente com nossa equipe.

Acesse o Portal do Cliente pelo link:
${params.portalUrl}

Se precisar de qualquer suporte ou tiver dúvidas, nossa equipe está à total disposição.

${legalFooter}`;
}

export async function sendClientWelcomeEmail(
  params: SendClientWelcomeEmailParams,
  sendFn: SendEmailFn = sendEmailViaResend,
): Promise<SendClientWelcomeEmailResult> {
  const fromEmail = process.env.INVITATION_FROM_EMAIL || "Portal do Cliente <onboarding@resend.dev>";
  const portalUrl = `${getAppBaseUrl()}/portal`;

  const html = renderHtml({
    clientName: params.clientName,
    companyName: params.companyName,
    organizationName: params.organizationName,
    portalUrl,
  });

  const text = renderText({
    clientName: params.clientName,
    companyName: params.companyName,
    organizationName: params.organizationName,
    portalUrl,
  });

  const subject = `Bem-vindo(a) à ${params.organizationName} - Seu portal de demandas está pronto!`;

  const result = await sendFn({
    to: params.to,
    from: fromEmail,
    subject,
    html,
    text,
  });

  if (result.ok) {
    return { delivered: true };
  }

  return { delivered: false, reason: result.reason };
}
