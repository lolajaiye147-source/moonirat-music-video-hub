export default function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="aspect-video bg-dark-700" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-dark-600 rounded-full w-4/5" />
        <div className="h-3 bg-dark-700 rounded-full w-3/5" />
        <div className="h-2.5 bg-dark-700 rounded-full w-1/4" />
      </div>
    </div>
  );
}

export function SkeletonArtistCard() {
  return (
    <div className="card animate-pulse flex flex-col items-center gap-3 p-4">
      <div className="w-16 h-16 rounded-full bg-dark-700" />
      <div className="space-y-2 w-full">
        <div className="h-3 bg-dark-600 rounded-full w-3/5 mx-auto" />
        <div className="h-2.5 bg-dark-700 rounded-full w-2/5 mx-auto" />
      </div>
    </div>
  );
}
