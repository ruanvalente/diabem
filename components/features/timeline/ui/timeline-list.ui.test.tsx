// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TimelineList } from "./timeline-list.ui";
import { formatTime } from "@/lib/date";
import type {
  Activity,
  GlucoseReading,
  Meal,
  Medication,
  Note,
} from "@/lib/db/types";
import type { TimelineEvent } from "@/lib/health/types";

const AT = "2026-09-01T13:30:00.000Z";
const TIME = formatTime(AT);
const LATER = "2026-09-01T18:00:00.000Z";
const OTHER_DAY = "2026-09-05T13:30:00.000Z";

const base = {
  userId: "u1",
  createdAt: AT,
  updatedAt: AT,
};

function glucoseEvent(
  at: string = AT,
  overrides: Partial<GlucoseReading> = {},
): TimelineEvent {
  const data: GlucoseReading = {
    ...base,
    id: "g1",
    value: 110,
    unit: "mg/dL",
    context: "fasting",
    measuredAt: at,
    ...overrides,
  };

  return { type: "glucose", id: data.id, at, data };
}

function mealEvent(
  at: string = AT,
  overrides: Partial<Meal> = {},
): TimelineEvent {
  const data: Meal = {
    ...base,
    id: "m1",
    type: "breakfast",
    description: "Omelete com pão",
    consumedAt: at,
    ...overrides,
  };

  return { type: "meal", id: data.id, at, data };
}

function activityEvent(
  at: string = AT,
  overrides: Partial<Activity> = {},
): TimelineEvent {
  const data: Activity = {
    ...base,
    id: "a1",
    type: "cycling",
    durationMinutes: 45,
    startedAt: at,
    ...overrides,
  };

  return { type: "activity", id: data.id, at, data };
}

function noteEvent(
  at: string = AT,
  overrides: Partial<Note> = {},
): TimelineEvent {
  const data: Note = {
    ...base,
    id: "n1",
    content: "Senti-me bem hoje",
    ...overrides,
  };

  return { type: "note", id: data.id, at, data };
}

function medicationEvent(
  at: string = AT,
  overrides: Partial<Medication> = {},
): TimelineEvent {
  const data: Medication = {
    ...base,
    id: "d1",
    name: "Metformina",
    medicatedAt: at,
    ...overrides,
  };

  return { type: "medication", id: data.id, at, data };
}

describe("TimelineList", () => {
  it("renders the provided empty state when there are no events", () => {
    render(
      <TimelineList events={[]} emptyState={<p>Nada por aqui</p>} />,
    );

    expect(screen.getByText("Nada por aqui")).toBeInTheDocument();
  });

  it("renders no groups and no empty state when there are no events and no empty state", () => {
    const { container } = render(<TimelineList events={[]} />);

    expect(container.querySelectorAll("section")).toHaveLength(0);
    expect(container).toHaveTextContent("");
  });

  it("groups events into one labelled region per local day", () => {
    render(
      <TimelineList
        events={[
          glucoseEvent(),
          glucoseEvent(OTHER_DAY, { id: "g2" }),
          mealEvent(OTHER_DAY, { id: "m2" }),
        ]}
      />,
    );

    const regions = screen.getAllByRole("region");
    expect(regions).toHaveLength(2);
    for (const region of regions) {
      expect(region).toHaveAccessibleName();
    }
  });

  it("orders same-day events from the most recent to the oldest", () => {
    render(
      <TimelineList
        events={[
          glucoseEvent(AT, { id: "g-older", value: 110 }),
          glucoseEvent(LATER, { id: "g-newer", value: 99 }),
        ]}
      />,
    );

    const [day] = screen.getAllByRole("region");
    expect(day.textContent).toMatch(/99 mg\/dL[\s\S]*110 mg\/dL/);
  });

  it("keeps a decorative icon per event", () => {
    const { container } = render(<TimelineList events={[glucoseEvent()]} />);

    const icons = container.querySelectorAll("svg");
    expect(icons).toHaveLength(1);
    expect(icons[0]).toHaveAttribute("aria-hidden", "true");
  });

  describe("glucose events", () => {
    it("renders the label, the reading badge, the time, the context and the notes", () => {
      render(
        <TimelineList
          events={[
            glucoseEvent(AT, { notes: "Medicação alterada", value: 156 }),
          ]}
        />,
      );

      expect(screen.getByText("Glicemia")).toBeInTheDocument();
      expect(screen.getByText("156 mg/dL")).toBeInTheDocument();
      expect(screen.getByText(TIME)).toBeInTheDocument();
      expect(
        screen.getByText("Jejum · Medicação alterada"),
      ).toBeInTheDocument();
    });

    it("omits the notes separator when there are no notes", () => {
      render(<TimelineList events={[glucoseEvent()]} />);

      expect(screen.getByText("Jejum")).toBeInTheDocument();
    });
  });

  describe("meal events", () => {
    it("renders the meal type as the title and the description with the notes", () => {
      render(
        <TimelineList events={[mealEvent(AT, { notes: "Com café" })]} />,
      );

      expect(screen.getByText("Café da manhã")).toBeInTheDocument();
      expect(screen.getByText(TIME)).toBeInTheDocument();
      expect(
        screen.getByText("Omelete com pão · Com café"),
      ).toBeInTheDocument();
    });

    it("omits the notes separator when there are no notes", () => {
      render(<TimelineList events={[mealEvent()]} />);

      expect(screen.getByText("Omelete com pão")).toBeInTheDocument();
    });
  });

  describe("title layout", () => {
    it("keeps the time outside the title when the event renders a badge", () => {
      render(<TimelineList events={[glucoseEvent()]} />);

      const title = screen.getByText("Glicemia");
      expect(title.tagName).toBe("P");
      expect(title).not.toHaveTextContent(TIME);
      expect(title.parentElement).toHaveTextContent(TIME);
    });

    it("nests the time inside the title when the event has no badge", () => {
      render(<TimelineList events={[mealEvent()]} />);

      const title = screen.getByText("Café da manhã");
      expect(title.tagName).toBe("P");
      expect(title).toHaveTextContent(TIME);
    });
  });

  describe("activity events", () => {
    it("renders the activity type as the title and the duration with the notes", () => {
      render(
        <TimelineList
          events={[activityEvent(AT, { notes: "No parque" })]}
        />,
      );

      expect(screen.getByText("Ciclismo")).toBeInTheDocument();
      expect(screen.getByText(TIME)).toBeInTheDocument();
      expect(screen.getByText("45 min · No parque")).toBeInTheDocument();
    });

    it("omits the notes separator when there are no notes", () => {
      render(<TimelineList events={[activityEvent()]} />);

      expect(screen.getByText("45 min")).toBeInTheDocument();
    });
  });

  describe("note events", () => {
    it("renders the label as the title and the content", () => {
      render(<TimelineList events={[noteEvent()]} />);

      expect(screen.getByText("Observação")).toBeInTheDocument();
      expect(screen.getByText(TIME)).toBeInTheDocument();
      expect(screen.getByText("Senti-me bem hoje")).toBeInTheDocument();
    });
  });

  describe("medication events", () => {
    it("renders the name as the title and the clinical details with the notes", () => {
      render(
        <TimelineList
          events={[
            medicationEvent(AT, {
              dosage: "500",
              unit: "mg",
              frequency: "2x ao dia",
              route: "oral",
              notes: "Em jejum",
            }),
          ]}
        />,
      );

      expect(screen.getByText("Metformina")).toBeInTheDocument();
      expect(screen.getByText(TIME)).toBeInTheDocument();
      expect(
        screen.getByText("Medicamento · 500 mg · 2x ao dia · oral · Em jejum"),
      ).toBeInTheDocument();
    });

    it("omits the details and notes separators when there are none", () => {
      render(<TimelineList events={[medicationEvent()]} />);

      expect(screen.getByText("Medicamento")).toBeInTheDocument();
    });
  });

  it("renders every event type in a single day without duplicating content", () => {
    render(
      <TimelineList
        events={[
          glucoseEvent(),
          mealEvent(),
          activityEvent(),
          noteEvent(),
          medicationEvent(),
        ]}
      />,
    );

    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(screen.getByText("Glicemia")).toBeInTheDocument();
    expect(screen.getByText("Café da manhã")).toBeInTheDocument();
    expect(screen.getByText("Ciclismo")).toBeInTheDocument();
    expect(screen.getByText("Observação")).toBeInTheDocument();
    expect(screen.getByText("Metformina")).toBeInTheDocument();
  });
});
