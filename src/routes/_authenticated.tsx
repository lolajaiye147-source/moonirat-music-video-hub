import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ context, location }) => {
    // During SSR this will redirect unauthenticated, but ssr:false means this only runs client-side
    // The actual auth check happens in the component with useAuth
    if (!context.auth?.user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
