import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import supabase from "@/utils/supabase";

export default function AppSidebar() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const location = useLocation();

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-6 border-b">
        <h1 className="text-2xl font-bold">EventApp</h1>
        <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                <Link to="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/dashboard/events")}
              >
                <Link to="/dashboard/events">
                  <Calendar className="mr-2 h-4 w-4" />
                  Events
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              onClick={logout}
              className="text-red-600"
            >
              <button className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
