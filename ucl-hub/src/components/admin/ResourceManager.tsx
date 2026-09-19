"use client";

import { Plus } from "lucide-react";
import { useMemo, useState, type DependencyList, type ReactNode } from "react";
import type { ZodType } from "zod";
import { LoadMore } from "@/components/common/LoadMore";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagedList } from "@/hooks/usePagedList";
import type { Page } from "@/lib/backend/types";
import { toUserMessage } from "@/utils/errors";
import { matchesQuery } from "@/utils/text";
import { DataTable, type Column } from "./DataTable";
import { DynamicForm } from "./DynamicForm";
import type { FieldDef, FormValues } from "./fields";

export interface RowAction<T> {
  label: string;
  onClick: (item: T) => void;
  show?: (item: T) => boolean;
}

interface ResourceManagerProps<T extends { id: string }, TInput> {
  title: string;
  description: string;
  /** Singular noun for buttons and messages, e.g. "announcement". */
  singular: string;
  fields: readonly FieldDef[];
  schema: ZodType<TInput>;
  columns: readonly Column<T>[];
  loadPage: (cursor: unknown | undefined) => Promise<Page<T>>;
  loadDeps: DependencyList;
  create?: (input: TInput) => Promise<unknown>;
  update?: (item: T, input: TInput) => Promise<unknown>;
  remove?: (item: T) => Promise<unknown>;
  canEdit?: (item: T) => boolean;
  canDelete?: (item: T) => boolean;
  /** Text fields the search box looks through. Omit to hide the search box. */
  searchText?: (item: T) => string[];
  defaults?: FormValues;
  deleteMessage?: (item: T) => string;
  extraActions?: readonly RowAction<T>[];
  toolbar?: ReactNode;
  headerActions?: ReactNode;
  modalSize?: "md" | "lg";
}

/**
 * The shared management screen: searchable paginated table + create/edit modal +
 * delete confirmation. Each admin area supplies fields, columns and service calls.
 */
export function ResourceManager<T extends { id: string }, TInput>({
  title,
  description,
  singular,
  fields,
  schema,
  columns,
  loadPage,
  loadDeps,
  create,
  update,
  remove,
  canEdit = () => true,
  canDelete = () => true,
  searchText,
  defaults,
  deleteMessage,
  extraActions = [],
  toolbar,
  headerActions,
  modalSize = "lg",
}: ResourceManagerProps<T, TInput>) {
  const toast = useToast();
  const list = usePagedList<T>(loadPage, loadDeps);
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const rows = useMemo(() => (searchText && query ? list.items.filter((item) => matchesQuery(searchText(item), query)) : list.items), [list.items, query, searchText]);
  const hasRowActions = Boolean(update || remove || extraActions.length > 0);

  async function confirmDelete() {
    if (!deleting || !remove) return;
    setDeleteBusy(true);
    try {
      await remove(deleting);
      toast.success(`The ${singular} was deleted.`);
      setDeleting(null);
      list.reload();
    } catch (error) {
      toast.error(toUserMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            {headerActions}
            {create && (
              <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setEditing("new")}>
                New {singular}
              </Button>
            )}
          </>
        }
      />

      {(searchText || toolbar) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {searchText && <SearchInput value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}`} label={`Search ${title.toLowerCase()}`} className="sm:w-80" />}
          {toolbar}
        </div>
      )}

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <LoadingRows />
      ) : rows.length === 0 ? (
        <EmptyState
          title={query ? "Nothing matches your search" : `No ${title.toLowerCase()} yet`}
          description={query ? "Try different words." : create ? `Create the first ${singular} to get started.` : undefined}
          action={create && !query ? <Button onClick={() => setEditing("new")}>New {singular}</Button> : undefined}
        />
      ) : (
        <DataTable
          caption={title}
          columns={columns}
          rows={rows}
          actions={
            hasRowActions
              ? (item) => (
                  <div className="flex justify-end gap-1">
                    {extraActions.filter((a) => a.show?.(item) ?? true).map((action) => (
                      <Button key={action.label} variant="secondary" size="sm" onClick={() => action.onClick(item)}>
                        {action.label}
                      </Button>
                    ))}
                    {update && canEdit(item) && (
                      <Button variant="secondary" size="sm" onClick={() => setEditing(item)} aria-label={`Edit ${singular}`}>
                        Edit
                      </Button>
                    )}
                    {remove && canDelete(item) && (
                      <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" onClick={() => setDeleting(item)} aria-label={`Delete ${singular}`}>
                        Delete
                      </Button>
                    )}
                  </div>
                )
              : undefined
          }
        />
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? `New ${singular}` : `Edit ${singular}`} size={modalSize}>
        {editing !== null && (
          <DynamicForm<TInput>
            fields={fields}
            schema={schema}
            item={editing === "new" ? null : (editing as unknown as Record<string, unknown>)}
            defaults={defaults}
            submitLabel={editing === "new" ? `Create ${singular}` : "Save changes"}
            onCancel={() => setEditing(null)}
            onSubmit={async (input) => {
              if (editing === "new") await create?.(input);
              else await update?.(editing, input);
              toast.success(editing === "new" ? `The ${singular} was created.` : "Changes saved.");
              setEditing(null);
              list.reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete this ${singular}?`}
        message={deleting ? (deleteMessage?.(deleting) ?? "This can't be undone.") : ""}
        confirmLabel="Delete"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

/** Adapts an "all at once" list call to the paged interface (for small collections). */
export function singlePage<T>(load: () => Promise<T[]>): () => Promise<Page<T>> {
  return async () => ({ items: await load(), nextCursor: null });
}
