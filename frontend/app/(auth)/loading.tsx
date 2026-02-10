export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 p-4">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-8 w-32 rounded-md bg-muted" />
          <div className="h-10 w-full rounded-md bg-muted" />
          <div className="h-10 w-full rounded-md bg-muted" />
          <div className="h-10 w-full rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
