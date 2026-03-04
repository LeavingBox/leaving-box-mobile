export interface ModuleManual {
  name: string;
  description: string;
  rules?: string[];
  imgUrl: string;
  _id?: string;              // ID MongoDB optionnel
  moduleId?: string;         // ID du module optionnel
  solutions?: string[];      // Solutions optionnelles (fusionnées depuis solutionsByOperator)
}
