import { greeting } from "../utils/greeting";

type DashboardHeaderProps = {
  userName?: string;
};

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {greeting(new Date())}, {userName ?? "usuário"} !
      </h1>
      <p className="text-muted-foreground">
        Veja como foi seu acompanhamento hoje.
      </p>
    </div>
  );
}