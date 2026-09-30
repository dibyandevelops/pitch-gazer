import { create } from "zustand";
import type { Prediction, Team } from "@/types/football";

export type QualityLevel = "low" | "medium" | "high";
export type CameraFocus = "overview" | "home" | "away";

interface MatchState {
  teams: Team[];
  homeId: string | null;
  awayId: string | null;
  prediction: Prediction | null;
  isSimulating: boolean;
  quality: QualityLevel;
  focus: CameraFocus;
  cameraResetRun: number;
  pressureAnimationRun: number;
  setTeams: (teams: Team[]) => void;
  setHome: (id: string | null) => void;
  setAway: (id: string | null) => void;
  swapSides: () => void;
  setPrediction: (p: Prediction | null) => void;
  setSimulating: (v: boolean) => void;
  setQuality: (q: QualityLevel) => void;
  setFocus: (f: CameraFocus) => void;
  animatePressure: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  teams: [],
  homeId: null,
  awayId: null,
  prediction: null,
  isSimulating: false,
  quality: "high",
  focus: "overview",
  cameraResetRun: 0,
  pressureAnimationRun: 0,
  setTeams: (teams) => set({ teams }),
  setHome: (homeId) => set({ homeId, prediction: null, focus: "home" }),
  setAway: (awayId) => set({ awayId, prediction: null, focus: "away" }),
  swapSides: () => set((s) => ({ homeId: s.awayId, awayId: s.homeId, prediction: null })),
  setPrediction: (prediction) => set({ prediction }),
  setSimulating: (isSimulating) => set({ isSimulating }),
  setQuality: (quality) => set({ quality }),
  setFocus: (focus) => set((state) => ({ focus, cameraResetRun: state.cameraResetRun + 1 })),
  animatePressure: () => set((state) => ({ pressureAnimationRun: state.pressureAnimationRun + 1 })),
}));

export const selectHomeTeam = (s: MatchState) => s.teams.find((t) => t.id === s.homeId);
export const selectAwayTeam = (s: MatchState) => s.teams.find((t) => t.id === s.awayId);
