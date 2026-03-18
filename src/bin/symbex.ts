#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { createCommand } from "@commander-js/extra-typings";

import { loadConfig } from "@/config";
import { Graph, Parser } from "@/core";
import { printDotGraph } from "@/dot";
import type { NodePath } from "@/models";

import pkg from "../../package.json";
import { fileArg, othersArg } from "./args";
import queryCommand from "./commands/query";
import { group } from "./groups";
import { configOption, encodingOption } from "./options";

const program = createCommand()
  .name(pkg.name)
  .version(
    pkg.version,
    "-v, --version",
    "Output the version of installed package",
  )
  .description(pkg.description)
  .addArgument(fileArg)
  .addArgument(othersArg)
  .addOption(configOption)
  .addOption(encodingOption)
  .option("-l, --list", "print a list of nodes", false)
  .option("-d, --dot [name]", "print the graph in DOT format", false)
  .option("-o, --output <output>", "output file name", false)
  .commandsGroup(group.command.dev)
  .addCommand(queryCommand)
  .action((file, others, options) => {
    const config = loadConfig(options.config);
    const parser = new Parser(config);
    const { nodes, edges } = parser.parse(
      file,
      readFileSync(file, options.encoding),
    );
    // add root file node once
    nodes.push({
      path: [file] as NodePath,
      kind: "module",
      type: "scope",
    });

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
      console.log(printDotGraph(graph.serialize(), { indent: 2 }));
    }

    if (others.length > 0) {
      others.forEach((f: string) => {
        // console.log(parser.parse(f));
      });
    }
  });

program.parse();
