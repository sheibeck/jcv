import { CodeBase } from "./CodeBase";

export class Component {
    Name: string;
    CodeBases = new Array<CodeBase>();

    constructor(name) {
      this.Name = name;
    }

    AddCodeBase(codeBase) {
      this.CodeBases.push(codeBase);
    }
}
  