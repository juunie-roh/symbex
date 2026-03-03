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
  .action((file, others, options, command) => {
    const config = loadConfig(options.path);
    const parser = Parser.get(config);
    const tree = parser.parse(file);
    console.log(`Edges: ${tree.edges.length}, Nodes: ${tree.nodes.length}`);
    tree.edges.forEach((e) => {
      console.log(`[EDGE]: ${e.from} ==== ${e.kind} ====> ${e.to}`);
    });
    tree.nodes.forEach((n) => {
      console.log("====== [NODE] ======");
      console.log(`ID:       ${n.id}`);
      console.log(`NodeKind: ${n.kind}`);
      console.log(`byte:     ${n.range.startIndex} to ${n.range.endIndex}`);
      console.log(
        `position: ${n.range.startPosition.row}:${n.range.startPosition.column} to ${n.range.endPosition.row}:${n.range.endPosition.column}`,
      );
      console.log(`meta:     ${n.meta ? JSON.stringify(n.meta) : "undefined"}`);
    });

    if (others) {
      others.forEach((f: string) => {
        // console.log(parser.parse(f));
      });
    }
  });

program.parse(process.argv);
