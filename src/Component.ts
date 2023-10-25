import { CodeBase } from "./CodeBase";

export class Component {
    Name: string;
    CodeBases = new Array<CodeBase>();

    constructor(name: string) {
      this.Name = name;
    }

    AddCodeBase(codeBase: CodeBase) {
      this.CodeBases.push(codeBase);
    }
}
  