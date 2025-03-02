import { validateRequest } from "@/auth";

import { ModeToggle } from "@/components/ModeToggle";
import { SidebarProvider } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import SessionProvider from "./SessionProvider";
import { AuthProvider } from "./AuthContext";
import QueryProvider from "./QueryProvider";
import { AppSidebar } from "@/components/AppSidebar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, session } = await validateRequest();

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider value={{ user: user ?? null, session }}>
      <SidebarProvider>
        <main className="w-full">
          <QueryProvider>
            <AppSidebar>
              <AuthProvider>{children}</AuthProvider>
            </AppSidebar>
          </QueryProvider>

          <div className="absolute top-11 md:top-2 right-2 ">
            <ModeToggle />
          </div>
        </main>
      </SidebarProvider>
    </SessionProvider>
  );
}
