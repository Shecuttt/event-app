import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Ticket,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface SidebarNavProps {
  isOrganizer: boolean;
}

export function SidebarNav({ isOrganizer }: SidebarNavProps) {
  const organizerMenus = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Event Saya",
      href: "/dashboard/events",
      icon: Calendar,
    },
  ];

  const generalMenus = [
    {
      title: "Buat Event",
      href: "/dashboard/events/new",
      icon: PlusCircle,
    },
    {
      title: "Tiket Saya",
      href: "/dashboard/tickets",
      icon: Ticket,
    },
    {
      title: "Pengaturan",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {isOrganizer &&
            organizerMenus.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton render={<Link href={item.href} />}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          {generalMenus.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton render={<Link href={item.href} />}>
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
