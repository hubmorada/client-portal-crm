import { formatFileSize } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import type { PortalAttachment } from "@/lib/client-portal/attachments";

export function PortalAttachmentsList({
  attachments,
  emptyDescription,
  onDelete,
}: {
  attachments: PortalAttachment[];
  emptyDescription: string;
  onDelete?: (attachmentId: string) => Promise<void>;
}) {
  if (attachments.length === 0) {
    return <EmptyState title="No files yet" description={emptyDescription} />;
  }

  return (
    <ul className="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200">
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {attachment.originalName}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(attachment.sizeBytes)} ·{" "}
              {attachment.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/api/portal/attachments/${attachment.id}/download`}
              className="shrink-0 rounded text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Download
            </a>
            {onDelete && (
              <DeleteButton
                action={onDelete.bind(null, attachment.id)}
                itemName="file"
                confirmTitle="Delete file"
                confirmDescription={`Are you sure you want to delete ${attachment.originalName}? This action cannot be undone.`}
                successMessage="File deleted"
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
