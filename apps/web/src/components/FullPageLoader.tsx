export function FullPageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Loading...</p>
    </div>
  );
}
