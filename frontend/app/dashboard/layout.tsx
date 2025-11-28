"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore, applyTheme } from "@/stores/theme";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Building2, Home, Users, Factory, Upload, LogOut, Menu, Database } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, labelJp: "ダッシュボード" },
  { href: "/dashboard/apartments", label: "Apartments", icon: Building2, labelJp: "社宅" },
  { href: "/dashboard/employees", label: "Employees", icon: Users, labelJp: "従業員" },
  { href: "/dashboard/factories", label: "Factories", icon: Factory, labelJp: "派遣先" },
  { href: "/dashboard/import", label: "Import", icon: Upload, labelJp: "インポート" },
  { href: "/dashboard/data", label: "Data", icon: Database, labelJp: "データ管理" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">UNS-Shatak</h1>
              <p className="text-xs text-muted-foreground">社宅管理システム</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                  <item.icon className="w-5 h-5" />
                  <div>
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground ml-1">{item.labelJp}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border space-y-3">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            
            {/* User Info */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{user?.full_name || user?.username}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{user?.role}</span>
            </div>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-foreground">UNS-Shatak</h1>
        </header>
        <main className="p-6">{children}</main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
