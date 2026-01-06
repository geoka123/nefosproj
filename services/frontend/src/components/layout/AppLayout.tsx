import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar.tsx";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};
