"use client";

import { useState } from "react";
import { browserCapabilities, type BrowserCapabilities } from "../capabilities";

export function useBrowserCapabilities(): BrowserCapabilities {
  const [caps] = useState<BrowserCapabilities>(() => browserCapabilities());
  return caps;
}