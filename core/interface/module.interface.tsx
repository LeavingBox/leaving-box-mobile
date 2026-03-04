export interface ModuleManual {
  _id?: string;
  moduleId?: string;
  name: string;
  description: string;
  rules?: string[] | string;
  solutions?: string[] | string;
  imgUrl: string;
  _id?: string;              // ID MongoDB optionnel
  moduleId?: string;         // ID du module optionnel
  solutions?: string[];      // Solutions optionnelles (fusionnées depuis solutionsByOperator)
}
