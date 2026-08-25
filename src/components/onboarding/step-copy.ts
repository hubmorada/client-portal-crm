import type { OnboardingStepKey } from "@/generated/prisma/enums";

/**
 * Stage 3 UI-owned copy — one short sentence per step, distinct from
 * `ONBOARDING_STEPS[key].label` (src/lib/onboarding/steps.ts), which is the
 * backend's own short title, not a full row description. Kept here, not in
 * the Stage 2 catalog, since Stage 3 is UI-only and this stage's task
 * explicitly scopes it to "use only Stage 2 backend."
 */
export const ONBOARDING_STEP_DESCRIPTIONS: Record<OnboardingStepKey, string> = {
  WELCOME: "Uma lista rápida para te ajudar a aproveitar ao máximo seu espaço de trabalho.",
  COMPANY_PROFILE: "Adicione sua razão social, país, moeda e fuso horário.",
  PAYMENT_DETAILS: "Informe aos clientes onde enviar seus pagamentos.",
  DOMAIN_SETUP: "Revise o endereço do seu espaço de trabalho e um domínio personalizado opcional.",
  CREATE_CLIENT: "Adicione as pessoas ou empresas com quem você trabalha.",
  CREATE_PROJECT: "Organize seu trabalho em projetos para cada cliente.",
  CREATE_TASK: "Divida um projeto em demandas que você possa acompanhar.",
  INVITE_TEAMMATE: "Traga um colega para a sua organização.",
  INVITE_PORTAL_USER: "Dê a um cliente acesso seguro ao seu próprio portal.",
  REVIEW_BILLING: "Revise seu plano e detalhes de faturamento.",
  FINISH: "Oculte esta lista quando estiver tudo pronto — você sempre poderá voltar.",
};
