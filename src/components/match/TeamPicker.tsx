import { useEffect, useId, useRef, useState } from "react";
import type { Team } from "@/types/football";

interface TeamPickerProps {
  side: "HOME" | "AWAY";
  teams: Team[];
  selected: Team | undefined;
  onSelect: (id: string) => void;
}

export function TeamPicker({ side, teams, selected, onSelect }: TeamPickerProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const available = [...teams]
    .sort((left, right) => {
      const priority = (league: string) => (league === "Premier League" ? 0 : 1);
      return (
        priority(left.league) - priority(right.league) ||
        left.league.localeCompare(right.league) ||
        left.name.localeCompare(right.name)
      );
    })
    .filter((team) =>
      `${team.name} ${team.league}`.toLowerCase().includes(query.trim().toLowerCase()),
    );

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const closePicker = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <section className="relative">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] font-medium tracking-[0.24em] text-muted-foreground">
          {side} TEAM
        </p>
        {selected ? (
          <span className="text-[10px] text-muted-foreground">{selected.league}</span>
        ) : null}
      </div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`${inputId}-list`}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-left transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {selected ? (
          <TeamCrest team={selected} />
        ) : (
          <span className="grid size-10 place-items-center rounded-lg border border-dashed border-white/20 text-lg text-muted-foreground">
            ＋
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {selected?.name ?? "Choose a team"}
          </span>
          <span className="mt-1 block text-[10px] text-muted-foreground">
            {selected
              ? "Last five matches · illustrative form"
              : "Premier League clubs shown first"}
          </span>
        </span>
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          {open ? "−" : "⌄"}
        </span>
      </button>

      {selected ? (
        <div
          className="mt-2 flex items-center gap-1.5 pl-1"
          role="group"
          aria-label={`Last five results for ${selected.name}`}
        >
          {selected.form.map((result, index) => (
            <span
              key={`${result}-${index}`}
              aria-label={result === "W" ? "Win" : result === "D" ? "Draw" : "Loss"}
              className={`grid size-5 place-items-center rounded-full text-[9px] font-bold ${result === "W" ? "bg-emerald-400/15 text-emerald-300" : result === "D" ? "bg-amber-300/15 text-amber-200" : "bg-rose-400/15 text-rose-300"}`}
            >
              {result}
            </span>
          ))}
          <span className="ml-1 text-[9px] text-muted-foreground">FORM</span>
        </div>
      ) : null}

      {open ? (
        <div
          id={`${inputId}-list`}
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
        >
          <div className="border-b border-white/10 p-2">
            <p className="mb-2 px-1 font-mono text-[8px] tracking-[0.15em] text-primary">
              PREMIER LEAGUE FIRST · CHAMPIONS LEAGUE NEXT
            </p>
            <input
              ref={searchRef}
              id={inputId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") closePicker(true);
              }}
              placeholder="Search teams or leagues"
              aria-label={`Search ${side.toLowerCase()} teams`}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/70"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1" aria-label={`${side} teams`}>
            {available.map((team) => (
              <li key={team.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(team.id);
                    closePicker(true);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/7 focus-visible:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <TeamCrest team={team} small />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {team.name}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {team.league}
                    </span>
                  </span>
                  <span className="text-[9px] text-muted-foreground">{team.shortName}</span>
                </button>
              </li>
            ))}
            {available.length === 0 ? (
              <li className="px-3 py-5 text-center text-xs text-muted-foreground">
                No teams match that search.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function TeamCrest({ team, small = false }: { team: Team; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-xl border border-white/20 font-mono font-bold shadow-inner ${small ? "size-8 text-[9px]" : "size-10 text-[10px]"}`}
      style={{
        background: `linear-gradient(145deg, ${team.colors.primary}, ${team.colors.secondary})`,
        color: team.colors.secondary,
      }}
    >
      {team.shortName.slice(0, 3)}
    </span>
  );
}
