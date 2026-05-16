import { auth } from "@/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut, LayoutDashboard, PlusCircle, User } from "lucide-react";
import { signOutAction } from "@/src/actions/auth";
import { cn } from "@/lib/utils";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold tracking-tight text-primary">Ivento</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/events"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden md:flex"
            )}
          >
            Jelajahi Event
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/events/new"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "hidden sm:flex"
                )}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Buat Event
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "relative h-10 w-10 rounded-full outline-none"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image || ""} alt={user.name || ""} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.name && <p className="font-medium">{user.name}</p>}
                      {user.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <Link
                      href="/dashboard"
                      className="flex w-full items-center gap-2 px-2 py-1.5"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <Link
                      href="/dashboard/events"
                      className="flex w-full items-center gap-2 px-2 py-1.5"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>Event Saya</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={signOutAction}>
                    <button className="w-full text-left">
                      <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </button>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: "default" }))}
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
