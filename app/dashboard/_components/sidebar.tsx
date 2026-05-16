"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface DashboardSidebarProps {
  children: ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardSidebar({ children, user }: DashboardSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-4">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <span className="font-bold">I</span>
          </div>
          <span className="text-xl font-bold tracking-tight truncate group-data-[collapsible=icon]:hidden">
            Ivento
          </span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {children}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.image || ""} alt={user.name || ""} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium truncate">{user.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
