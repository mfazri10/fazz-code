import { Loader2 } from "lucide-react";

export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          Loading workspace...
        </p>
      </div>
    </div>
  );
}
