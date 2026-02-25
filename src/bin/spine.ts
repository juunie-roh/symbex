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
  .option("-l, --list", "print a list of nodes", true)
  .option(
    "-p, --path <config-path>",
    "specify path of configuration",
    "spine.config.json",
  )
  .action(async (file, others, options, command) => {
    // others?.forEach((file: string) => console.log(file));
    // TODO: Discriminate file extensions
    // TODO: Check if current module supports - Error specification
    // TODO: Plugin interface definition
    // TODO: Plugin availability check - Error specification
    // const { parse, convert } = await import("@juun-roh/spine-typescript");
    // const tree = convert(await parse(file));
    // if (options.list) {
    //   console.log(tree);
    // }
    const config = loadConfig(options.path);
    const parser = Parser.get(config);
    const tree = parser.parse(file);
    console.log(tree);
  });

program.parse(process.argv);
