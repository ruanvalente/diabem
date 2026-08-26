"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Menu, Wifi } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur-md sm:px-8 lg:px-5">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="lg:hidden" />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* <div className="hidden items-center gap-2 lg:flex">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">
              
            </span>
          </div>
        </div> */}
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="gap-1 border-success/30 bg-success/10 text-success"
        >
          <Wifi className="size-3" />
          <span className="hidden sm:inline">Online</span>
        </Badge>

        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="size-4" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
        </Button>

        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            RV
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
