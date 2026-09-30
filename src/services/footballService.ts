import { HEAD_TO_HEAD, TEAMS } from "@/data/teams";
import { UPCOMING_FIXTURES } from "@/data/fixtures";
import type { Competition, HeadToHead, Team, UpcomingFixture } from "@/types/football";

/**
 * Data-source boundary. The app only ever talks to this interface, so a real
 * provider (football-data.org, a hosted database, …) can replace the mock
 * implementation without changing the engine, the store or any component.
 */
export interface FootballDataService {
  listTeams(): Promise<Team[]>;
  listUpcomingFixtures(competition?: Competition): Promise<UpcomingFixture[]>;
  getTeam(id: string): Promise<Team | undefined>;
  getHeadToHead(homeId: string, awayId: string): Promise<HeadToHead | undefined>;
}

const key = (a: string, b: string) => [a, b].sort().join("__");

export class MockFootballService implements FootballDataService {
  constructor(
    private readonly teams: Team[] = TEAMS,
    private readonly h2h: HeadToHead[] = HEAD_TO_HEAD,
    private readonly fixtures: UpcomingFixture[] = UPCOMING_FIXTURES,
  ) {}

  async listTeams(): Promise<Team[]> {
    return this.teams;
  }

  async listUpcomingFixtures(competition?: Competition): Promise<UpcomingFixture[]> {
    return [...this.fixtures]
      .filter((fixture) => !competition || fixture.competition === competition)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.find((t) => t.id === id);
  }

  async getHeadToHead(homeId: string, awayId: string): Promise<HeadToHead | undefined> {
    return this.h2h.find((h) => h.key === key(homeId, awayId));
  }
}

export const footballService: FootballDataService = new MockFootballService();
