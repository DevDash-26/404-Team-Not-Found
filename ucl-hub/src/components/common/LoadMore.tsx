import { Button } from "@/components/ui/Button";

/** "Load more" control for cursor-paginated lists. */
export function LoadMore({ hasMore, loading, onClick }: { hasMore: boolean; loading: boolean; onClick: () => void }) {
  if (!hasMore) return null;
  return (
    <div className="mt-6 flex justify-center">
      <Button variant="secondary" onClick={onClick} loading={loading}>
        Load more
      </Button>
    </div>
  );
}
