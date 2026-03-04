export type SolutionWithIndex = { index: number; text: string };

export type ModuleManual = {
  _id?: string;
  moduleId?: string;
  name: string;
  description: string;
  rules?: string[] | string;
  solutions?: string[] | SolutionWithIndex[];
  imgUrl?: string;
};
