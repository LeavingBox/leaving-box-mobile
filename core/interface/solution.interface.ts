import type { ModuleManual, SolutionWithIndex } from "./module.interface";

export type AnalystSolution = {
  moduleId: string;
  solutions: string[] | SolutionWithIndex[];
};

export type SolutionsDistribution = {
  moduleId: string;
  allocations?: Record<string, string[]>;
  operatorId?: string;
  solutions?: string[];
};

/** Module brut (peut être un document Mongoose avec _doc) */
export type RawModule = ModuleManual | { _doc?: Partial<ModuleManual> };

/** Payload de l'événement gameStarted (WebSocket) */
export type GameStartedData = {
  moduleManuals?: RawModule[];
  solutionsByAnalyste?: Record<string, AnalystSolution[]>;
  session?: unknown;
  solutionsDistribution?: SolutionsDistribution[];
};
