import { getCurrentMembership } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  RecordCardList,
  RecordCard,
  RecordCardField,
  RecordCardActions,
} from "@/components/ui/record-list";
import { CopyLinkButton } from "@/components/team/copy-link-button";
import { InviteForm } from "@/components/team/invite-form";
import { ResendInvitationForm } from "@/components/team/resend-invitation-form";
import { CancelInvitationButton } from "@/components/team/cancel-invitation-button";
import { RoleSelect } from "@/components/team/role-select";
import { TransferOwnershipButton } from "@/components/team/transfer-ownership-button";
import { RemoveMemberButton } from "@/components/team/remove-member-button";
import { LeaveOrganizationButton } from "@/components/team/leave-organization-button";
import {
  inviteMemberAction,
  resendInvitationAction,
  cancelInvitationAction,
  changeRoleAction,
  removeMemberAction,
  leaveOrganizationAction,
} from "./actions";

export default async function TeamPage() {
  const { user, organizationId, membership } = await getCurrentMembership();

  const [memberships, invitations] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.invitation.findMany({
      where: { organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { invitedBy: { select: { name: true, email: true } } },
    }),
  ]);

  const canManage = membership.role === Role.OWNER || membership.role === Role.ADMIN;
  const isOwner = membership.role === Role.OWNER;

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Equipe
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie os membros e permissões da sua organização.
          </p>
        </div>
        <LeaveOrganizationButton
          action={leaveOrganizationAction}
          disabled={isOwner}
          disabledReason={
            isOwner
              ? "Você é o único proprietário — transfira a propriedade para outro membro antes de sair."
              : undefined
          }
        />
      </div>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          Membros da equipe
        </h2>
        <div className="hidden xl:block">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>E-mail</TableHeaderCell>
                <TableHeaderCell>Função</TableHeaderCell>
                <TableHeaderCell>Entrou em</TableHeaderCell>
                {isOwner && <TableHeaderCell align="right">Ações</TableHeaderCell>}
              </tr>
            </TableHead>
            <TableBody>
              {memberships.map((m) => {
                const isSelf = m.userId === user.id;
                return (
                  <TableRow key={m.id}>
                    <TableCell emphasis>
                      {m.user.name}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          (Você)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{m.user.email}</TableCell>
                    <TableCell>
                      {isOwner && !isSelf ? (
                        <RoleSelect
                          membershipId={m.id}
                          currentRole={m.role as "ADMIN" | "MEMBER"}
                          action={changeRoleAction}
                        />
                      ) : (
                        <StatusBadge status={m.role} />
                      )}
                    </TableCell>
                    <TableCell>{m.createdAt.toLocaleDateString("pt-BR")}</TableCell>
                    {isOwner && (
                      <TableCell align="right">
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-4">
                            <TransferOwnershipButton
                              memberName={m.user.name}
                              onConfirm={changeRoleAction.bind(null, m.id, Role.OWNER)}
                            />
                            <RemoveMemberButton
                              action={removeMemberAction.bind(null, m.id)}
                              memberName={m.user.name}
                            />
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <RecordCardList>
          {memberships.map((m) => {
            const isSelf = m.userId === user.id;
            return (
              <RecordCard key={m.id}>
                <RecordCardField
                  label="Nome"
                  emphasis
                  value={
                    <>
                      {m.user.name}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-gray-500">(Você)</span>
                      )}
                    </>
                  }
                />
                <RecordCardField label="E-mail" value={m.user.email} />
                <RecordCardField
                  label="Função"
                  value={
                    isOwner && !isSelf ? (
                      <RoleSelect
                        membershipId={m.id}
                        currentRole={m.role as "ADMIN" | "MEMBER"}
                        action={changeRoleAction}
                      />
                    ) : (
                      <StatusBadge status={m.role} />
                    )
                  }
                />
                <RecordCardField label="Entrou em" value={m.createdAt.toLocaleDateString("pt-BR")} />
                {isOwner && !isSelf && (
                  <RecordCardActions>
                    <TransferOwnershipButton
                      memberName={m.user.name}
                      onConfirm={changeRoleAction.bind(null, m.id, Role.OWNER)}
                    />
                    <RemoveMemberButton
                      action={removeMemberAction.bind(null, m.id)}
                      memberName={m.user.name}
                    />
                  </RecordCardActions>
                )}
              </RecordCard>
            );
          })}
        </RecordCardList>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          Convites pendentes
        </h2>
        {invitations.length === 0 ? (
          <EmptyState
            title="Nenhum convite pendente"
            description="Envie um convite abaixo para adicionar novos colaboradores à sua equipe."
          />
        ) : (
          <>
            <div className="hidden xl:block">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>E-mail</TableHeaderCell>
                    <TableHeaderCell>Função</TableHeaderCell>
                    <TableHeaderCell>Convidado por</TableHeaderCell>
                    <TableHeaderCell>Expira em</TableHeaderCell>
                    <TableHeaderCell align="right">
                      {canManage ? "Ações" : "Link"}
                    </TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell emphasis>{invitation.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={invitation.role} />
                      </TableCell>
                      <TableCell>
                        {invitation.invitedBy?.name ??
                          invitation.invitedBy?.email ??
                          "—"}
                      </TableCell>
                      <TableCell>{invitation.expiresAt.toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell align="right">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-4">
                            <ResendInvitationForm
                              action={resendInvitationAction.bind(null, invitation.id)}
                              initialToken={invitation.token}
                            />
                            <CancelInvitationButton
                              action={cancelInvitationAction.bind(null, invitation.id)}
                              email={invitation.email}
                            />
                          </div>
                        ) : (
                          <CopyLinkButton token={invitation.token} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <RecordCardList>
              {invitations.map((invitation) => (
                <RecordCard key={invitation.id}>
                  <RecordCardField label="E-mail" value={invitation.email} emphasis />
                  <RecordCardField label="Função" value={<StatusBadge status={invitation.role} />} />
                  <RecordCardField
                    label="Convidado por"
                    value={invitation.invitedBy?.name ?? invitation.invitedBy?.email ?? "—"}
                  />
                  <RecordCardField label="Expira em" value={invitation.expiresAt.toLocaleDateString("pt-BR")} />
                  <RecordCardActions>
                    {canManage ? (
                      <>
                        <ResendInvitationForm
                          action={resendInvitationAction.bind(null, invitation.id)}
                          initialToken={invitation.token}
                        />
                        <CancelInvitationButton
                          action={cancelInvitationAction.bind(null, invitation.id)}
                          email={invitation.email}
                        />
                      </>
                    ) : (
                      <CopyLinkButton token={invitation.token} />
                    )}
                  </RecordCardActions>
                </RecordCard>
              ))}
            </RecordCardList>
          </>
        )}
      </section>

      {canManage && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Convidar membro
          </h2>
          <div className="mt-4 max-w-md rounded-lg border border-gray-200 bg-white p-6">
            <InviteForm action={inviteMemberAction} />
          </div>
        </section>
      )}
    </div>
  );
}
