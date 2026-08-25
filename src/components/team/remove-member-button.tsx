"use client";

import { useRef, useState } from "react";
import { ConfirmDialog, type ConfirmDialogHandle } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/toast/toast-provider";

export function RemoveMemberButton({
  action,
  memberName,
}: {
  action: () => Promise<void>;
  memberName: string;
}) {
  const dialogRef = useRef<ConfirmDialogHandle>(null);
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await action();
      showToast(`${memberName} removido com sucesso`);
    } catch {
      showToast(`Falha ao remover ${memberName}.`, "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => dialogRef.current?.open()}
        className="rounded text-sm font-medium text-red-600 transition-colors hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Remover
      </button>
      <ConfirmDialog
        ref={dialogRef}
        title="Remover membro"
        description={`Remover ${memberName} desta organização? O acesso será revogado imediatamente.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleConfirm}
      />
    </>
  );
}
