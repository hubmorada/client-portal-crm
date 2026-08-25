import { getCurrentUserOrganization } from "@/lib/current-user";
import { NOTIFICATION_TYPES, getNotificationPreferenceMap } from "@/lib/notifications/preferences";
import { NotificationPreferenceToggle } from "@/components/settings/notification-preference-toggle";
import { ResetPreferencesButton } from "@/components/settings/reset-preferences-button";
import type { NotificationType } from "@/generated/prisma/enums";

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, { title: string; description: string }> = {
  ROLE_CHANGED: {
    title: "Cargo alterado",
    description: "Quando o seu cargo na organização é alterado.",
  },
  OWNERSHIP_TRANSFERRED: {
    title: "Propriedade transferida",
    description: "Quando a propriedade da organização é transferida para você.",
  },
  MEMBER_REMOVED: {
    title: "Removido da organização",
    description: "Quando você é removido de uma organização.",
  },
  INVITATION_ACCEPTED: {
    title: "Convite de equipe aceito",
    description: "Quando alguém aceita um convite de equipe enviado por você.",
  },
  PORTAL_INVITATION_ACCEPTED: {
    title: "Convite do Portal aceito",
    description: "Quando um cliente aceita um convite de acesso ao portal enviado por você.",
  },
  INVOICE_STATUS_CHANGED: {
    title: "Status da fatura alterado",
    description: "Quando o status de uma fatura é alterado (apenas Administradores).",
  },
  MENTIONED: {
    title: "Mencionado em comentário",
    description: "Quando alguém menciona você (@) em um comentário.",
  },
  SUBSCRIPTION_ACTIVATED: {
    title: "Assinatura ativada",
    description: "Quando a assinatura da sua organização fica ativa.",
  },
  PAYMENT_FAILED: {
    title: "Falha no pagamento",
    description: "Quando ocorre uma falha no processamento de pagamento.",
  },
  SUBSCRIPTION_CANCELED: {
    title: "Assinatura cancelada",
    description: "Quando a assinatura da sua organização é cancelada.",
  },
  PLAN_CHANGED: {
    title: "Plano alterado",
    description: "Quando o plano de assinatura da organização é modificado.",
  },
  TASK_CREATED: {
    title: "Nova demanda criada",
    description: "Quando uma nova demanda é aberta.",
  },
  TASK_STATUS_CHANGED: {
    title: "Status da demanda alterado",
    description: "Quando o status de uma demanda muda no fluxo.",
  },
  TASK_ASSIGNEE_CHANGED: {
    title: "Responsável pela demanda alterado",
    description: "Quando uma demanda é atribuída a um membro da equipe.",
  },
  TASK_DUE_DATE_CHANGED: {
    title: "Prazo da demanda alterado",
    description: "Quando a data de entrega de uma demanda é atualizada.",
  },
  TASK_COMPLETED: {
    title: "Demanda concluída",
    description: "Quando uma demanda é marcada como finalizada.",
  },
};

export default async function NotificationPreferencesPage() {
  const { user } = await getCurrentUserOrganization();
  const preferences = await getNotificationPreferenceMap(user.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Preferências de notificação</h1>
      <p className="mt-1 text-sm text-gray-600">
        Escolha sobre o que você deseja ser notificado e se também quer receber por e-mail.
      </p>

      <div className="mt-6 flex justify-end">
        <ResetPreferencesButton />
      </div>

      <div className="mt-2 overflow-hidden overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Tipo de notificação
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                No Sistema
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Por E-mail
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {NOTIFICATION_TYPES.map((type) => {
              const { title, description } = NOTIFICATION_TYPE_LABELS[type];
              const descId = `${type}-description`;
              const preference = preferences[type];

              return (
                <tr key={type}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{title}</p>
                    <p id={descId} className="mt-0.5 text-xs text-gray-500">
                      {description}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <NotificationPreferenceToggle
                      type={type}
                      channel="inApp"
                      defaultChecked={preference.inAppEnabled}
                      label={`In-app notifications for ${title}`}
                      describedById={descId}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <NotificationPreferenceToggle
                      type={type}
                      channel="email"
                      defaultChecked={preference.emailEnabled}
                      label={`Email notifications for ${title}`}
                      describedById={descId}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
