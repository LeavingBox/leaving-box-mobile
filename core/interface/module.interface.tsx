export type ResolutionItem = {
  parity: string;
  comparison: string;
  letters: string[];
};

export type StructuredSolution = {
  type: "resolution" | "conditions";
  items: ResolutionItem[] | string[];
};

export type SolutionWithIndex = {
  index: number;
  text: string | StructuredSolution;
};

export type ModuleManual = {
  _id?: string;
  moduleId?: string;
  name: string;
  title?: string;
  Objectif?: string;
  description: string | string[];
  rules?: string[] | string;
  gameRules?: string[];
  hints?: string[];
  solutions?: string[] | SolutionWithIndex[] | StructuredSolution[];
  imgUrl?: string;
};
