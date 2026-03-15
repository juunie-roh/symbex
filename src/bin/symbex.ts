#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { program } from "commander";

import { loadConfig } from "@/config";
import { Graph, Parser } from "@/core";

import pkg from "../../package.json";

program
  .version(pkg.version)
  .description(pkg.description)
  .argument("<file>", "a target file name to parse")
  .argument("[others...]", "additional files")
  .option("-l, --list", "print a list of nodes", false)
  .option("-d, --dot [name]", "print the graph in DOT format", false)
  .option("-o, --output <output>", "output file name", false)
  .option(
    "-p, --path <config-path>",
    "specify path of configuration",
    "spine.config.json",
  )
  .action((file, others, options, command) => {
    const config = loadConfig(options.path);
    const parser = new Parser(config);
    const { nodes, edges } = parser.parse(file, readFileSync(file, "utf-8"));
    // add root file node once
    nodes.push({ signature: file, kind: "module", type: "scope" });

    const graph = new Graph(nodes, edges);

    if (options.list) {
      console.log(graph.serialize());
    }

    if (options.output) {
      writeFileSync(
        resolve(process.cwd(), options.output),
        JSON.stringify(graph.serialize()),
      );
    }

    if (options.dot) {
      console.log(parser.toDot(file, graph));
    }

    if (others) {
      others.forEach((f: string) => {
        // console.log(parser.parse(f));
      });
    }
  });

program.parse(process.argv);
