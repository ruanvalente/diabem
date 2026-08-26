"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, [pathname]);

  return null;
}
