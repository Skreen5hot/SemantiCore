import type { ColumnMapping, MappingManifest } from "./types.js";
import type { WarningResource } from "../../kernel/index.js";
import { makeWarning } from "../../kernel/warnings.js";

export function getColumnMappings(mappingManifest: MappingManifest | null | undefined): {
  mappings: ColumnMapping[];
  warnings: WarningResource[];
} {
  if (!mappingManifest) {
    return {
      mappings: [],
      warnings: [
        makeWarning({
          code: "sc:MappingManifestMissing",
          message: "A mapping manifest is required for adapter ingestion.",
        }),
      ],
    };
  }

  const mappings = mappingManifest["sc:columnMappings"] ?? mappingManifest.columnMappings ?? [];
  const warnings: WarningResource[] = [];
  const seenSource = new Set<string>();
  const seenTarget = new Set<string>();

  for (const mapping of mappings) {
    const source = mapping["sc:sourceColumn"];
    const target = mapping["sc:targetProperty"]?.["@id"];
    if (!source || !target) {
      warnings.push(
        makeWarning({
          code: "sc:MappingManifestAmbiguous",
          message: "A column mapping is missing sc:sourceColumn or sc:targetProperty.",
        }),
      );
      continue;
    }
    if (seenSource.has(source) || seenTarget.has(target)) {
      warnings.push(
        makeWarning({
          code: "sc:MappingManifestAmbiguous",
          message: `Mapping manifest contains duplicate source or target mapping for ${source}.`,
        }),
      );
    }
    seenSource.add(source);
    seenTarget.add(target);
  }

  return { mappings, warnings };
}

export function hasBlockingMappingWarnings(warnings: WarningResource[]): boolean {
  return warnings.some((warning) => {
    const code = warning["sc:code"]["@id"];
    return code === "sc:MappingManifestMissing" || code === "sc:MappingManifestAmbiguous";
  });
}
