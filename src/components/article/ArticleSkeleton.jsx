import Skeleton from "@/components/ui/Skeleton";

export default function ArticleSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Skeleton className="aspect-video w-full mb-6" />
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-8 w-full mb-2" />
      <Skeleton className="h-8 w-4/5 mb-6" />
      <Skeleton className="h-16 w-full mb-6 rounded-xl" />
      <Skeleton className="h-10 w-64 mb-6 rounded-full" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
