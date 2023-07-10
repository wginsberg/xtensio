import * as inquirer from "@inquirer/prompts";
import createCommand from "./create";
import generateCommand from "./generate";
import { Commands, CreateValues, GenerateValues } from "./types";
import buildCommand from "./build";
import * as fs from "fs";

export async function xtensioCLI<T extends Commands>(
  binaryPath: string, 
  _cwd: string, 
  command: T, 
  value: GenerateValues | CreateValues 
) {
  const cwd = process.cwd();
  switch(command){
    case "create": 
      createCommand(cwd, value as CreateValues);
      return;
    case "generate":
      generateCommand(cwd, value as GenerateValues);
      return;
    case "build":
      buildCommand(cwd);
      return;
    default:
      throw Error(`Command ${command} was not found!`);
  }
}
