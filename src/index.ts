import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stableStringify, transform } from "./kernel/index.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    process.stderr.write("Usage: node dist/index.js <input-file.jsonld>\n");
    process.exit(1);
  }

  const inputPath = resolve(args[0]);

  try {
    const raw = await readFile(inputPath, "utf-8");
    const input: unknown = JSON.parse(raw);
    const output = transform(input);
    process.stdout.write(stableStringify(output, true) + "\n");
  } catch (error) {
    if (error instanceof SyntaxError) {
      process.stderr.write(`Invalid JSON in input file: ${error.message}\n`);
    } else if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      process.stderr.write(`File not found: ${inputPath}\n`);
    } else {
      process.stderr.write(
        `Error: ${error instanceof Error ? error.message : String(error)}\n`,
      );
    }
    process.exit(1);
  }
}

await main();
