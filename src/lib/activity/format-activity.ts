import { formatCurrency, formatStatusLabel } from "@/lib/format";
import { formatInvoiceStatusLabel } from "@/lib/invoices/status-label";
import type { ActivityAction, ActivityEntityType } from "@/generated/prisma/enums";

export type ActivityDisplayModel = {
  actorLabel: string;
  actionLabel: string;
  entityLabel: string | null;
  detailLines: string[];
  timestamp: Date;
  isDeleted: boolean;
};

export type ActivityFormatInput = {
  entityType: ActivityEntityType;
  action: ActivityAction;
  metadata: unknown;
  actor: { name: string; email: string } | null;
  createdAt: Date;
};

const FIELD_LABELS: Record<string, string> = {
  name: "nome",
  email: "e-mail",
  phone: "telefone",
  company: "empresa",
  status: "status",
  clientId: "cliente",
  projectId: "projeto",
  startDate: "data de início",
  endDate: "data de término",
  dueDate: "prazo",
  title: "título",
  priority: "prioridade",
  invoiceNumber: "número da fatura",
  amount: "valor",
  currency: "moeda",
  issueDate: "data de emissão",
  notes: "observações",
  internalNotes: "notas internas",
  discountType: "tipo de desconto",
  discountValue: "desconto",
  taxRatePercent: "impostos",
  taxLabel: "rótulo fiscal",
  lineItems: "itens",
  legacyArchive: "arquivo PDF legado",
};

function humanizeFieldName(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function strList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function numeric(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

type PartialModel = Pick<ActivityDisplayModel, "actionLabel" | "entityLabel" | "detailLines">;

const FALLBACK: PartialModel = {
  actionLabel: "Atividade registrada",
  entityLabel: null,
  detailLines: [],
};

function isDataEntity(entityType: ActivityEntityType): boolean {
  return (
    entityType === "CLIENT" ||
    entityType === "PROJECT" ||
    entityType === "TASK" ||
    entityType === "INVOICE"
  );
}

function entityNoun(entityType: ActivityEntityType): string {
  switch (entityType) {
    case "CLIENT":
      return "o cliente";
    case "PROJECT":
      return "o projeto";
    case "TASK":
      return "a demanda";
    case "INVOICE":
      return "a fatura";
    default:
      return "";
  }
}

function nameField(entityType: ActivityEntityType): string {
  if (entityType === "TASK") return "title";
  if (entityType === "INVOICE") return "invoiceNumber";
  return "name";
}

function buildDataEntityModel(
  entityType: ActivityEntityType,
  action: ActivityAction,
  metadata: Record<string, unknown>,
): PartialModel {
  const noun = entityNoun(entityType);
  const name = str(metadata[nameField(entityType)]);
  if (!name) return FALLBACK;

  if (action === "CREATED" || action === "DELETED") {
    const verb = action === "CREATED" ? "criou" : "excluiu";
    const detailLines: string[] = [];
    if (entityType === "INVOICE") {
      const amount = numeric(metadata.amount);
      const currency = str(metadata.currency) ?? "BRL";
      if (amount !== null) detailLines.push(formatCurrency(amount, currency));
    }
    return { actionLabel: `${verb} ${noun} ${name}`, entityLabel: name, detailLines };
  }

  if (action === "STATUS_CHANGED") {
    const from = str(metadata.from);
    const to = str(metadata.to);
    if (!from || !to) return FALLBACK;
    const label = entityType === "INVOICE" ? formatInvoiceStatusLabel : formatStatusLabel;
    return {
      actionLabel: `alterou o status d${noun === "a demanda" ? "a demanda" : noun === "a fatura" ? "a fatura" : "o item"} ${name}`,
      entityLabel: name,
      detailLines: [`${label(from)} → ${label(to)}`],
    };
  }

  if (action === "UPDATED") {
    const changedFields = strList(metadata.changedFields);
    const detailLines =
      changedFields.length > 0
        ? [`Campos alterados: ${changedFields.map(humanizeFieldName).join(", ")}`]
        : [];
    return { actionLabel: `atualizou ${noun} ${name}`, entityLabel: name, detailLines };
  }

  return FALLBACK;
}

function buildInvitationModel(
  action: ActivityAction,
  metadata: Record<string, unknown>,
): PartialModel {
  const email = str(metadata.email);
  if (!email) return FALLBACK;
  const role = str(metadata.role);
  const roleLabel = formatStatusLabel(role ?? "MEMBER");

  switch (action) {
    case "INVITATION_SENT":
      return { actionLabel: `convidou ${email} como ${roleLabel}`, entityLabel: email, detailLines: [] };
    case "INVITATION_RESENT":
      return {
        actionLabel: `reenviou o convite para ${email}`,
        entityLabel: email,
        detailLines: [],
      };
    case "INVITATION_CANCELED":
      return {
        actionLabel: `cancelou o convite de ${email}`,
        entityLabel: email,
        detailLines: [],
      };
    case "INVITATION_ACCEPTED":
      return {
        actionLabel: `aceitou o convite como ${roleLabel}`,
        entityLabel: email,
        detailLines: [],
      };
    default:
      return FALLBACK;
  }
}

function buildMembershipModel(
  action: ActivityAction,
  metadata: Record<string, unknown>,
): PartialModel {
  if (action === "ROLE_CHANGED") {
    const memberName = str(metadata.memberName);
    const from = str(metadata.from);
    const to = str(metadata.to);
    if (!memberName || !from || !to) return FALLBACK;
    return {
      actionLabel: `alterou o cargo de ${memberName}`,
      entityLabel: memberName,
      detailLines: [`${formatStatusLabel(from)} → ${formatStatusLabel(to)}`],
    };
  }

  if (action === "OWNERSHIP_TRANSFERRED") {
    const previousOwnerName = str(metadata.previousOwnerName);
    const newOwnerName = str(metadata.newOwnerName);
    if (!previousOwnerName || !newOwnerName) return FALLBACK;
    return {
      actionLabel: "transferiu a propriedade da organização",
      entityLabel: newOwnerName,
      detailLines: [`${previousOwnerName} → ${newOwnerName}`],
    };
  }

  if (action === "MEMBER_REMOVED") {
    const memberName = str(metadata.memberName);
    if (!memberName) return FALLBACK;
    return {
      actionLabel: `removeu ${memberName} da organização`,
      entityLabel: memberName,
      detailLines: [],
    };
  }

  if (action === "MEMBER_LEFT") {
    return { actionLabel: "saiu da organização", entityLabel: str(metadata.memberName), detailLines: [] };
  }

  return FALLBACK;
}

const ATTACHMENT_PARENT_NOUNS: Record<string, string> = {
  CLIENT: "cliente",
  PROJECT: "projeto",
  INVOICE: "fatura",
};

function buildAttachmentModel(
  action: ActivityAction,
  metadata: Record<string, unknown>,
): PartialModel {
  const fileName = str(metadata.fileName);
  const parentEntityLabel = str(metadata.parentEntityLabel);
  const parentNoun = ATTACHMENT_PARENT_NOUNS[str(metadata.parentEntityType) ?? ""];
  if (!fileName || !parentEntityLabel || !parentNoun) return FALLBACK;

  if (action === "FILE_UPLOADED") {
    return {
      actionLabel: `anexou o arquivo ${fileName} no ${parentNoun} ${parentEntityLabel}`,
      entityLabel: fileName,
      detailLines: [],
    };
  }

  if (action === "FILE_DELETED") {
    return {
      actionLabel: `removeu o arquivo ${fileName} do ${parentNoun} ${parentEntityLabel}`,
      entityLabel: fileName,
      detailLines: [],
    };
  }

  return FALLBACK;
}

function buildPortalUserModel(
  action: ActivityAction,
  metadata: Record<string, unknown>,
): PartialModel {
  const clientName = str(metadata.clientName);
  if (!clientName) return FALLBACK;

  switch (action) {
    case "PORTAL_INVITATION_SENT": {
      const email = str(metadata.email);
      if (!email) return FALLBACK;
      return {
        actionLabel: `convidou ${email} para o Portal do Cliente de ${clientName}`,
        entityLabel: email,
        detailLines: [],
      };
    }
    case "PORTAL_INVITATION_RESENT": {
      const email = str(metadata.email);
      if (!email) return FALLBACK;
      return {
        actionLabel: `reenviou o convite do Portal para ${email} (${clientName})`,
        entityLabel: email,
        detailLines: [],
      };
    }
    case "PORTAL_INVITATION_CANCELED": {
      const email = str(metadata.email);
      if (!email) return FALLBACK;
      return {
        actionLabel: `cancelou o convite do Portal para ${email} (${clientName})`,
        entityLabel: email,
        detailLines: [],
      };
    }
    case "PORTAL_INVITATION_ACCEPTED":
      return {
        actionLabel: `ativou o acesso ao Portal do Cliente de ${clientName}`,
        entityLabel: clientName,
        detailLines: [],
      };
    case "PORTAL_USER_REMOVED": {
      const portalUserName = str(metadata.portalUserName);
      if (!portalUserName) return FALLBACK;
      return {
        actionLabel: `removeu o acesso de ${portalUserName} ao Portal do Cliente (${clientName})`,
        entityLabel: portalUserName,
        detailLines: [],
      };
    }
    default:
      return FALLBACK;
  }
}

const COMMENT_PARENT_NOUNS: Record<string, string> = {
  PROJECT: "projeto",
  TASK: "demanda",
};

function buildCommentModel(action: ActivityAction, metadata: Record<string, unknown>): PartialModel {
  const parentNoun = COMMENT_PARENT_NOUNS[str(metadata.parentEntityType) ?? ""];
  const parentEntityLabel = str(metadata.parentEntityLabel);
  if (!parentNoun || !parentEntityLabel) return FALLBACK;

  if (action === "CREATED") {
    const commentPreview = str(metadata.commentPreview);
    return {
      actionLabel: `comentou n${parentNoun === "demanda" ? "a demanda" : "o projeto"} ${parentEntityLabel}`,
      entityLabel: parentEntityLabel,
      detailLines: commentPreview ? [commentPreview] : [],
    };
  }

  if (action === "UPDATED") {
    const commentPreview = str(metadata.commentPreview);
    return {
      actionLabel: `editou um comentário n${parentNoun === "demanda" ? "a demanda" : "o projeto"} ${parentEntityLabel}`,
      entityLabel: parentEntityLabel,
      detailLines: commentPreview ? [commentPreview] : [],
    };
  }

  if (action === "DELETED") {
    return {
      actionLabel: `excluiu um comentário d${parentNoun === "demanda" ? "a demanda" : "o projeto"} ${parentEntityLabel}`,
      entityLabel: parentEntityLabel,
      detailLines: [],
    };
  }

  return FALLBACK;
}

function buildModel(
  entityType: ActivityEntityType,
  action: ActivityAction,
  metadata: Record<string, unknown>,
): PartialModel {
  if (isDataEntity(entityType)) return buildDataEntityModel(entityType, action, metadata);
  if (entityType === "INVITATION") return buildInvitationModel(action, metadata);
  if (entityType === "MEMBERSHIP") return buildMembershipModel(action, metadata);
  if (entityType === "ATTACHMENT") return buildAttachmentModel(action, metadata);
  if (entityType === "PORTAL_USER") return buildPortalUserModel(action, metadata);
  if (entityType === "COMMENT") return buildCommentModel(action, metadata);
  return FALLBACK;
}

export function formatActivity(input: ActivityFormatInput): ActivityDisplayModel {
  const metadata = isRecord(input.metadata) ? input.metadata : {};
  const actorLabel = input.actor?.name || str(metadata.actorName) || "Usuário";
  const isDeleted = input.action === "DELETED" || input.action === "FILE_DELETED";

  let partial: PartialModel;
  try {
    partial = buildModel(input.entityType, input.action, metadata);
  } catch {
    partial = FALLBACK;
  }

  return { ...partial, actorLabel, timestamp: input.createdAt, isDeleted };
}
