#!/usr/bin/env node

import { program } from "commander";

import { loadConfig } from "@/config";
import { Graph, Parser } from "@/core";

import pkg from "../../package.json";

program
  .version(pkg.version)
  .description(pkg.description)
  .argument("<file>", "a target file name to parse")
  .argument("[others...]", "additional files")
  .option("-l, --list", "print a list of nodes", true)
  .option("-o, --output <output>", "output file name", "spine-output.txt")
  .option(
    "-p, --path <config-path>",
    "specify path of configuration",
    "spine.config.json",
  )
  .action((file, others, options, command) => {
    const config = loadConfig(options.path);
    const parser = Parser.get(config);
    const { nodes, edges } = parser.parse(file);
    // add root file node once
    nodes.push({ id: file, kind: "file" });

    const graph = Graph.build(nodes, edges);
    console.log(graph.serialize());

    if (others) {
      others.forEach((f: string) => {
        // console.log(parser.parse(f));
      });
    }
  });

program.parse(process.argv);
