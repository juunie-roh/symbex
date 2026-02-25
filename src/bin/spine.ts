#!/usr/bin/env node

import { program } from "commander";

import { loadConfig } from "@/config";
import { Parser } from "@/core";

import pkg from "../../package.json";

program
  .version(pkg.version)
  .description(pkg.description)
  .argument("<file>", "a target file name to parse")
  .argument("[others...]", "additional files")
  .option("-l, --list", "print a list of nodes on console", true)
  .option(
    "-p, --path <config-path>",
    "specify path of configuration",
    "spine.config.json",
  )
  .action(async (file: string, options, command, others?: string[]) => {
    const config = loadConfig(options.path);
    const parser = Parser.get(config);
    const tree = parser.parse(file);
    console.log(tree);

    if (others) {
      others.forEach((f: string) => {
        console.log(parser.parse(f));
      });
    }
  });

program.parse(process.argv);
