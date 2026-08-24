"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ClientSelector({
  clients,
  selectedClientId,
}: {
  clients: { id: string; name: string }[];
  selectedClientId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("clientId", value);
    } else {
      params.delete("clientId");
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div>
      <label htmlFor="client-select" className="block text-xs font-medium text-gray-500">
        Filter by Client
      </label>
      <select
        id="client-select"
        value={selectedClientId || ""}
        onChange={handleChange}
        className="mt-1 block w-[240px] rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
      >
        <option value="">All Clients (Full Agency View)</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
    </div>
  );
}
