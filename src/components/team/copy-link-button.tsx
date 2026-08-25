"use client";

import { useState } from "react";
import { useToast } from "@/components/toast/toast-provider";

export function CopyLinkButton({ token }: { token: string }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("Link de convite copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Não foi possível copiar o link", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
    >
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}
