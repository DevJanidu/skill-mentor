import { UserButton, useUser } from "@clerk/clerk-react";
import {
  BookOpen,
  CalendarCheck,
  Clock,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Menu,
  Plus,
  Star,
  UserCircle,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/mentor/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Booking Inbox",
    href: "/mentor/inbox",
    icon: Inbox,
    end: false,
  },
  {
    label: "My Sessions",
    href: "/mentor/sessions",
    icon: CalendarCheck,
    end: false,
  },
  {
    label: "My Subjects",
    href: "/mentor/subjects",
    icon: BookOpen,
    end: false,
  },
  {
    label: "Create Session",
    href: "/mentor/create-session",
    icon: Plus,
    end: false,
  },
  {
    label: "Availability",
    href: "/mentor/availability",
    icon: Clock,
    end: false,
  },
  {
    label: "Reviews",
    href: "/mentor/reviews",
    icon: Star,
    end: false,
  },
  {
    label: "Profile",
    href: "/mentor/profile",
    icon: UserCircle,
    end: false,
  },
] as const;

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 px-6 py-5"
        onClick={onLinkClick}
      >
        <GraduationCap className="h-6 w-6 text-zinc-900" />
        <span className="text-lg font-bold text-zinc-900">
          Skill<span className="text-zinc-500">Mentor</span>
        </span>
      </Link>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            onClick={onLinkClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* Back to site */}
      <div className="px-3 py-4">
        <Link
          to="/"
          onClick={onLinkClick}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );
}

export default function MentorLayout() {
  const { user } = useUser();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumb = pathSegments.map(
    (s) => s.charAt(0).toUpperCase() + s.slice(1),
  );

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent onLinkClick={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb */}
            <nav className="hidden text-sm text-zinc-500 sm:block">
              {breadcrumb.map((seg, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1">/</span>}
                  <span
                    className={
                      i === breadcrumb.length - 1
                        ? "font-medium text-zinc-900"
                        : ""
                    }
                  >
                    {seg}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-600 sm:block">
              {user?.firstName ?? "Mentor"}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
