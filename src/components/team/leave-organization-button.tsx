"use client";

import { useRef, useState } from "react";
import { ConfirmDialog, type ConfirmDialogHandle } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/toast/toast-provider";

export function LeaveOrganizationButton({
  action,
  disabled = false,
  disabledReason,
}: {
  action: () => Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const dialogRef = useRef<ConfirmDialogHandle>(null);
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await action();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Não foi possível sair da organização.",
        "error",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => dialogRef.current?.open()}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Sair da organização
      </button>
      {disabled && disabledReason && (
        <p className="mt-1 text-xs text-gray-500">{disabledReason}</p>
      )}
      <ConfirmDialog
        ref={dialogRef}
        title="Sair da organização"
        description="Tem certeza de que deseja sair desta organização? Você perderá o acesso aos clientes, projetos e demandas."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleConfirm}
      />
    </div>
  );
}
