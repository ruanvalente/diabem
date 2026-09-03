"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodRangeFilter } from "@/components/shared/period-range-filter";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { GlucoseTab } from "../ui/glucose-tab.ui";
import { ActivityTab } from "../ui/activity-tab.ui";
import { MealsTab } from "../ui/meals-tab.ui";
import { useStatistics } from "../hooks/use-statistics";

export function StatisticsWidget() {
  const {
    data,
    isLoading,
    error,
    selection,
    setSelection,
    reload,
  } = useStatistics();

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Estatísticas
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualize gráficos e indicadores da sua saúde
          </p>
        </div>
        <PeriodRangeFilter value={selection} onChange={setSelection} />
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            reload();
          }}
        />
      ) : (
        <Tabs defaultValue="glucose" className="mb-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="glucose">Glicemia</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
            <TabsTrigger value="meals">Alimentação</TabsTrigger>
          </TabsList>

          <TabsContent value="glucose" className="mt-4">
            <GlucoseTab stats={data.glucose} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ActivityTab stats={data.activity} />
          </TabsContent>

          <TabsContent value="meals" className="mt-4">
            <MealsTab stats={data.meals} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
