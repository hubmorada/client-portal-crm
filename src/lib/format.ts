const TRANSLATIONS: Record<string, string> = {
  // Status de Tarefas
  TODO: "A Fazer",
  IN_PROGRESS: "Em Progresso",
  IN_REVIEW: "Em Revisão",
  DONE: "Concluído",
  // Prioridades de Tarefas
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
  // Funções de Membros
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
  // Status de Projetos
  INACTIVE: "Inativo",
  // Status de Clientes
  ACTIVE: "Ativo",
  // Status de Faturas
  DRAFT: "Rascunho",
  SENT: "Enviado",
  OVERDUE: "Atrasada",
  PAID: "Paga",
  CANCELLED: "Cancelada",
  // Status de Convites
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  EXPIRED: "Expirado",
  REVOKED: "Revogado",
};

export function formatCurrency(amount: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
    amount,
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);

  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unitIndex]}`;
}

export function formatStatusLabel(status: string): string {
  const upper = status.toUpperCase();
  if (TRANSLATIONS[upper]) {
    return TRANSLATIONS[upper];
  }
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
