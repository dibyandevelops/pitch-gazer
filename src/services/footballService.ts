import { HEAD_TO_HEAD, TEAMS } from "@/data/teams";
import type { HeadToHead, Team } from "@/types/football";

/**
 * Data-source boundary. The app only ever talks to this interface, so a real
 * provider (football-data.org, a Lovable Cloud table, …) can replace the mock
 * implementation without changing the engine, the store or any component.
 */
export interface FootballDataService {
  listTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  getHeadToHead(homeId: string, awayId: string): Promise<HeadToHead | undefined>;
}

const key = (a: string, b: string) => [a, b].sort().join("__");

export class MockFootballService implements FootballDataService {
  constructor(
    private readonly teams: Team[] = TEAMS,
    private readonly h2h: HeadToHead[] = HEAD_TO_HEAD,
  ) {}

  async listTeams(): Promise<Team[]> {
    return this.teams;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.find((t) => t.id === id);
  }

  async getHeadToHead(homeId: string, awayId: string): Promise<HeadToHead | undefined> {
    return this.h2h.find((h) => h.key === key(homeId, awayId));
  }
}

export const footballService: FootballDataService = new MockFootballService();
