"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodRangeFilter } from "@/components/shared/period-range-filter";
import { PageHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { GlucoseTab } from "../ui/glucose-tab.ui";
import { ActivityTab } from "../ui/activity-tab.ui";
import { MealsTab } from "../ui/meals-tab.ui";
import { MedicationsTab } from "../ui/medications-tab.ui";
import { useStatistics } from "../hooks/use-statistics";

export function StatisticsWidget() {
  const {
    data,
    isLoading,
    error,
    selection,
    setSelection,
    medicationFilter,
    setMedicationFilter,
    medicationNames,
    reload,
  } = useStatistics();

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <PageHeader
        title="Estatísticas"
        description="Visualize gráficos e indicadores da sua saúde"
        action={<PeriodRangeFilter value={selection} onChange={setSelection} />}
        className="gap-4"
      />

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Tabs defaultValue="glucose" className="mb-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="glucose">Glicemia</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
              <TabsTrigger value="meals">Alimentação</TabsTrigger>
              <TabsTrigger value="medications">Medicamentos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="glucose" className="mt-4">
            <GlucoseTab stats={data.glucose} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ActivityTab stats={data.activity} />
          </TabsContent>

          <TabsContent value="meals" className="mt-4">
            <MealsTab stats={data.meals} />
          </TabsContent>

          <TabsContent value="medications" className="mt-4">
            <MedicationsTab
              stats={data.medications}
              names={medicationNames}
              filter={medicationFilter}
              onFilterChange={setMedicationFilter}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
