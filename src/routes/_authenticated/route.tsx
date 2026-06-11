import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    // We'll check auth in the component since we need the hook
    // The beforeLoad check is limited since auth state is client-side
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-purple border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    throw redirect({ to: "/auth", search: { redirect: location.href } });
  }

  return <Outlet />;
}
