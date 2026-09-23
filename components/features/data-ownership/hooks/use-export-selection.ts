import { useState } from "react";
import type { ExportFormat, ExportScope } from "@/lib/data-ownership";
import { dataOwnershipService } from "@/lib/data-ownership";

/**
 * Format and scope selection state used by the export and share dialogs.
 */
export function useExportSelection() {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [scope, setScope] = useState<ExportScope>(
    () => dataOwnershipService.defaultScope,
  );

  const anySelected =
    scope.glucose ||
    scope.meals ||
    scope.activities ||
    scope.notes ||
    scope.medications;

  function toggleScope(key: keyof ExportScope) {
    setScope((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return { format, setFormat, scope, toggleScope, anySelected };
}
