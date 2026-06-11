import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ context }) => {
    // Auth state is client-side only; this guard runs client-side because ssr: false
    // The actual redirect happens in the component below with useAuth
    return {};
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
