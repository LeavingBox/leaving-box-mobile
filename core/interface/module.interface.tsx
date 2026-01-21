export interface ModuleManual {
  _id?: string;
  moduleId?: string;
  name: string;
  description: string;
  rules?: string[] | string;
  solutions?: string[] | string;
  imgUrl: string;
}
