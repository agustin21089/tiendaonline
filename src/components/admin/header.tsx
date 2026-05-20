"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Bell } from "lucide-react";

export function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="h-14 bg-white border-b border-arena-200 px-6 flex items-center justify-between shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-warm-500 hover:bg-arena-50 hover:text-warm-700 transition-colors">
          <Bell className="w-4.5 h-4.5" />
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-arena-200">
          <div className="text-right">
            <p className="text-sm font-medium text-warm-800 leading-none">
              {session?.user?.name ?? "Admin"}
            </p>
            <p className="text-xs text-warm-400 mt-0.5">{session?.user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-warm-500"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
