import { createOption } from "@commander-js/extra-typings";

export const configOption = createOption(
  "--config <config-path>",
  "Specify configuration path to use",
).default("letant.config.json", `Look up for "letant.config.json" from cwd`);

export const encodingOption = createOption(
  "--encoding <buffer-encoding>",
  "Specify encoding type of the target file",
)
  .choices([
    "ascii",
    "utf8",
    "utf-8",
    "utf16le",
    "utf-16le",
    "ucs2",
    "ucs-2",
    "base64",
    "base64url",
    "latin1",
    "binary",
    "hex",
  ])
  .default("utf-8");

export const verboseOption = createOption(
  "--verbose",
  "Print stack traces on error",
).default(false);
