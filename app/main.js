import { createTagTeamRuntimeAdapter } from "./dist/adapters/integration/tagteam-runtime.js";

const phaseLabel = "Phase 6";
const fallbackRuntimeVersion = "7.0.0";

const sampleCsv = `Text,title,source
The agency shall publish the notice.,Publication duty,Regulation A
The committee may review the proposal.,Review authority,Policy B
The officer must record the decision.,Recordkeeping duty,Procedure C`;

const state = {
  format: "csv",
  mappingRows: [
    { sourceColumn: "Text", targetProperty: "schema:text" },
    { sourceColumn: "title", targetProperty: "schema:name" },
  ],
  tagTeamSourceProperty: "schema:text",
  mappingManifest: null,
  dataset: null,
  run: null,
  savedSession: null,
  ontologySet: null,
  contextManifest: null,
  runtime: null,
  runtimeMode: "auto",
  requiredTagTeamVersion: fallbackRuntimeVersion,
  versionPolicy: "sc:RejectOnMismatch",
  runtimeWarnings: [],
  outputView: "dataset",
};

const el = {
  formatSelect: document.querySelector("#formatSelect"),
  fileInput: document.querySelector("#fileInput"),
  loadSample: document.querySelector("#loadSample"),
  sourceInput: document.querySelector("#sourceInput"),
  inputStatus: document.querySelector("#inputStatus"),
  hasHeaderRow: document.querySelector("#hasHeaderRow"),
  jsonPointer: document.querySelector("#jsonPointer"),
  mappingRows: document.querySelector("#mappingRows"),
  mappingPreview: document.querySelector("#mappingPreview"),
  addMapping: document.querySelector("#addMapping"),
  normalizeData: document.querySelector("#normalizeData"),
  runEnrichment: document.querySelector("#runEnrichment"),
  recordCount: document.querySelector("#recordCount"),
  enrichedCount: document.querySelector("#enrichedCount"),
  warningCount: document.querySelector("#warningCount"),
  graphCount: document.querySelector("#graphCount"),
  sourcePath: document.querySelector("#sourcePath"),
  tagTeamSourceSelect: document.querySelector("#tagTeamSourceSelect"),
  resultsBody: document.querySelector("#resultsBody"),
  outputPreview: document.querySelector("#outputPreview"),
  graphFocusSummary: document.querySelector("#graphFocusSummary"),
  selectedGraphPreview: document.querySelector("#selectedGraphPreview"),
  saveSession: document.querySelector("#saveSession"),
  restoreSession: document.querySelector("#restoreSession"),
  clearSession: document.querySelector("#clearSession"),
  sessionStatus: document.querySelector("#sessionStatus"),
  sessionPreview: document.querySelector("#sessionPreview"),
  addOntology: document.querySelector("#addOntology"),
  ontologyFileInput: document.querySelector("#ontologyFileInput"),
  ontologyName: document.querySelector("#ontologyName"),
  ontologyAlignment: document.querySelector("#ontologyAlignment"),
  ontologyContent: document.querySelector("#ontologyContent"),
  ontologyList: document.querySelector("#ontologyList"),
  ontologyPreview: document.querySelector("#ontologyPreview"),
  contextPreview: document.querySelector("#contextPreview"),
  runtimeMode: document.querySelector("#runtimeMode"),
  detectRuntime: document.querySelector("#detectRuntime"),
  tagTeamBundleInput: document.querySelector("#tagTeamBundleInput"),
  requiredVersion: document.querySelector("#requiredVersion"),
  versionPolicy: document.querySelector("#versionPolicy"),
  useOntologies: document.querySelector("#useOntologies"),
  runtimeStatus: document.querySelector("#runtimeStatus"),
  runtimePreview: document.querySelector("#runtimePreview"),
};

document.documentElement.dataset.phase = phaseLabel;

el.loadSample.addEventListener("click", () => {
  el.formatSelect.value = "csv";
  state.format = "csv";
  el.sourceInput.value = sampleCsv;
  el.hasHeaderRow.checked = true;
  state.mappingRows = inferCsvMappings(sampleCsv);
  state.tagTeamSourceProperty = "schema:text";
  el.inputStatus.textContent = "Sample CSV loaded locally.";
  renderMapping();
  normalize();
});

el.fileInput.addEventListener("change", async () => {
  const file = el.fileInput.files?.[0];
  if (!file) return;
  const text = await file.text();
  el.sourceInput.value = text;
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".csv")) el.formatSelect.value = "csv";
  if (lowerName.endsWith(".json")) el.formatSelect.value = "json";
  if (lowerName.endsWith(".jsonld")) el.formatSelect.value = "jsonld";
  state.format = el.formatSelect.value;
  if (state.format === "csv" && el.hasHeaderRow.checked) {
    const inferred = inferCsvMappings(text);
    if (inferred.length > 0) {
      state.mappingRows = inferred;
      state.tagTeamSourceProperty = preferredTagTeamSourceProperty(tagTeamSourceOptions());
      renderMapping();
    }
  }
  el.inputStatus.textContent = `${file.name} loaded locally.`;
  normalize();
});

el.formatSelect.addEventListener("change", () => {
  state.format = el.formatSelect.value;
  renderMapping();
});

el.addMapping.addEventListener("click", () => {
  readMappingRows();
  state.mappingRows.push({ sourceColumn: "", targetProperty: "schema:text" });
  renderMapping();
});

el.normalizeData.addEventListener("click", normalize);
el.runEnrichment.addEventListener("click", runEnrichment);
el.saveSession.addEventListener("click", saveSession);
el.restoreSession.addEventListener("click", restoreSession);
el.clearSession.addEventListener("click", clearSession);
el.addOntology.addEventListener("click", addOntology);
el.ontologyFileInput.addEventListener("change", importOntologyFile);
el.detectRuntime.addEventListener("click", () => {
  refreshRuntimeStatus("Runtime detection refreshed.");
});
el.runtimeMode.addEventListener("change", () => {
  state.runtimeMode = el.runtimeMode.value;
  refreshRuntimeStatus("Runtime mode updated.");
});
el.requiredVersion.addEventListener("input", () => {
  state.requiredTagTeamVersion = el.requiredVersion.value.trim() || fallbackRuntimeVersion;
  refreshRuntimeStatus("Version policy updated.");
});
el.versionPolicy.addEventListener("change", () => {
  state.versionPolicy = el.versionPolicy.value;
  refreshRuntimeStatus("Version policy updated.");
});
el.tagTeamSourceSelect.addEventListener("change", () => {
  state.tagTeamSourceProperty = el.tagTeamSourceSelect.value;
  renderSourcePath();
  renderMappingPreview();
  renderSession();
});
el.useOntologies.addEventListener("change", () => {
  refreshRuntimeStatus("Ontology option updated.");
});
el.tagTeamBundleInput.addEventListener("change", loadLocalTagTeamBundle);

document.querySelectorAll("[data-output]").forEach((button) => {
  button.addEventListener("click", () => {
    state.outputView = button.dataset.output;
    document.querySelectorAll("[data-output]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderOutput();
  });
});

document.querySelectorAll("[data-download]").forEach((button) => {
  button.addEventListener("click", () => {
    const kind = button.dataset.download;
    const content = exportFor(kind);
    const extension = kind === "csv" ? "csv" : "jsonld";
    const type = kind === "csv" ? "text/csv" : "application/ld+json";
    downloadText(`semanticore-${kind}.${extension}`, content, type);
  });
});

function normalize() {
  readMappingRows();
  state.mappingManifest = buildMappingManifest();
  const source = el.sourceInput.value.trim();
  if (!source) {
    state.dataset = null;
    state.run = null;
    el.inputStatus.textContent = "No source data yet.";
    renderAll();
    return;
  }

  try {
    if (state.format === "csv") {
      state.dataset = csvToDataset(source, state.mappingManifest);
    } else if (state.format === "json") {
      state.dataset = jsonToDataset(JSON.parse(source), state.mappingManifest, el.jsonPointer.value.trim());
    } else {
      state.dataset = jsonLdToDataset(JSON.parse(source));
    }
    state.run = null;
    el.inputStatus.textContent = `Normalized ${state.dataset["sc:records"].length} record(s).`;
  } catch (error) {
    state.dataset = null;
    state.run = {
      "@context": coreContext(),
      "@id": "urn:semanticore:run:browser-demo:error",
      "@type": "sc:TransformResult",
      "sc:records": [],
      "sc:graphs": [],
      "sc:warnings": [makeWarning("sc:UnsupportedInputShape", error.message || String(error))],
    };
    el.inputStatus.innerHTML = `<span class="danger">${escapeHtml(error.message || String(error))}</span>`;
  }
  renderAll();
}

function runEnrichment() {
  if (!state.dataset) normalize();
  if (!state.dataset) return;

  const runtime = getActiveRuntime();
  const versionDecision = evaluateVersionPolicy(runtime.version);
  const graphs = [];
  const warnings = [...runtime.warnings, ...versionDecision.warnings];
  const records = state.dataset["sc:records"].map((record, index) => {
    const result = enrichRecord(record, index, runtime, versionDecision);
    if (result.graph) graphs.push(result.graph);
    warnings.push(...result.warnings);
    return result.record;
  });

  state.run = {
    "@context": coreContext(),
    "@id": "urn:semanticore:run:browser-demo",
    "@type": "sc:TransformResult",
    "sc:records": records,
    "sc:graphs": graphs,
    "sc:warnings": warnings,
    "sc:runtime": runtime.diagnostics,
  };
  const runtimeLabel = runtime.kind === "tagteam" ? `TagTeam ${runtime.version}` : "deterministic fallback runtime";
  el.inputStatus.textContent = `Enriched ${records.length} record(s) locally with ${runtimeLabel}.`;
  renderAll();
}

function enrichRecord(record, index, runtime, versionDecision) {
  const warnings = [];
  const sourceProperty = selectedTagTeamSourceProperty();
  const source = record["sc:source"] || {};
  const sourceText = source[sourceProperty];

  if (!versionDecision.canRun) {
    return {
      record: {
        ...record,
        "@type": ["sc:EnrichedRecord", "sc:SourceRecord"],
        "sc:semanticEnrichment": makeEnrichment(record["@id"], index, "sc:EnrichmentFailed", "", null, null, runtime.version),
      },
      graph: null,
      warnings,
    };
  }

  if (typeof sourceText !== "string" || sourceText.trim() === "") {
    warnings.push(makeWarning("sc:MissingSourceText", "No string value was found at the configured source property path.", record["@id"]));
    return {
      record: {
        ...record,
        "@type": ["sc:EnrichedRecord", "sc:SourceRecord"],
        "sc:semanticEnrichment": makeEnrichment(record["@id"], index, "sc:EnrichmentSkipped", "", null, null, runtime.version),
      },
      graph: null,
      warnings,
    };
  }

  let graphResult;
  try {
    graphResult = buildRuntimeGraph(record["@id"], index, sourceText, runtime);
  } catch (error) {
    warnings.push(makeWarning("sc:TagTeamRuntimeError", error.message || String(error), record["@id"]));
    return {
      record: {
        ...record,
        "@type": ["sc:EnrichedRecord", "sc:SourceRecord"],
        "sc:semanticEnrichment": makeEnrichment(record["@id"], index, "sc:EnrichmentFailed", sourceText, null, null, runtime.version),
      },
      graph: null,
      warnings,
    };
  }
  const graph = graphResult.graph;
  warnings.push(...graphResult.warnings);
  const summary = summarizeGraph(graph);
  return {
    record: {
      ...record,
      "@type": ["sc:EnrichedRecord", "sc:SourceRecord"],
      "sc:semanticEnrichment": makeEnrichment(record["@id"], index, "sc:EnrichmentSucceeded", sourceText, graph["@id"], summary, runtime.version),
    },
    graph,
    warnings,
  };
}

function makeEnrichment(recordId, index, status, sourceText, graphId, summary, tagTeamVersion = fallbackRuntimeVersion) {
  const enrichment = {
    "@id": `urn:semanticore:enrichment:${stableFragment(recordId)}:${index}`,
    "@type": "sc:TagTeamEnrichment",
    "sc:status": { "@id": status },
    "sc:sourcePropertyPath": {
      "@type": "sc:PropertyPath",
      "sc:path": [{ "@id": "sc:source" }, { "@id": selectedTagTeamSourceProperty() }],
      "sc:multiValuePolicy": { "@id": "sc:EnrichEachValue" },
    },
    "sc:tagTeamVersion": tagTeamVersion,
  };
  if (sourceText) enrichment["sc:sourceText"] = sourceText;
  if (graphId) enrichment["sc:namedGraph"] = { "@id": graphId };
  if (summary) enrichment["sc:summary"] = summary;
  return enrichment;
}

function buildRuntimeGraph(recordId, index, text, runtime) {
  const runtimeResult = runtime.buildGraph(text, tagTeamOptions(), buildOntologySet());
  const output = runtimeResult.output;
  const nodes = extractGraphNodes(output);
  const graph = {
    "@context": runtimeGraphContext(output),
    "@id": `urn:semanticore:graph:${stableFragment(recordId)}:${index}`,
    "@type": "sc:TagTeamGraph",
    "sc:graphForRecord": { "@id": recordId },
    "sc:graphIndex": index,
    "sc:runtimeKind": { "@id": runtime.kind === "tagteam" ? "sc:TagTeamRuntime" : "sc:DeterministicFallbackRuntime" },
    "@graph": nodes,
  };
  const metadata = tagTeamMetadata(output);
  if (metadata) graph["sc:tagTeamMetadata"] = metadata;
  graph["sc:ontologyBridge"] = ontologyBridgeReport(runtimeResult.bridge, nodes);
  return {
    graph,
    warnings: contextCollisionWarnings(output, recordId),
  };
}

function buildFallbackNodes(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 4);
  const uniqueWords = [...new Set(words)].slice(0, 4);
  const deontic = /\b(shall|must|required|may|should)\b/i.test(text);
  const nodes = uniqueWords.map((word) => ({
    "@id": `urn:tagteam:entity:${stableFragment(word)}`,
    "@type": "tagteam:Entity",
    "schema:name": word,
  }));
  if (deontic) {
    nodes.push({
      "@id": `urn:tagteam:act:${stableFragment(text)}`,
      "@type": ["tagteam:Act", "tagteam:DeonticSignal"],
      "schema:name": "deontic signal",
      "tagteam:deontic": true,
    });
  }
  return nodes;
}

function summarizeGraph(graph) {
  const metadata = graph["sc:tagTeamMetadata"];
  if (metadata) {
    return {
      "@type": "sc:TagTeamSummary",
      "sc:entityCount": Number(metadata.entities || countGraphEntities(graph)),
      "sc:actCount": Number(metadata.acts || countGraphActs(graph)),
      "sc:roleCount": Number(metadata.roles || 0),
      "sc:deonticDetected": graph["@graph"].some((node) => Boolean(node["tagteam:deontic"] || node["tagteam:deonticCategory"] || node["tagteam:modalMarker"])),
    };
  }
  return {
    "@type": "sc:TagTeamSummary",
    "sc:entityCount": countGraphEntities(graph),
    "sc:actCount": countGraphActs(graph),
    "sc:roleCount": 0,
    "sc:deonticDetected": graph["@graph"].some((node) => Boolean(node["tagteam:deontic"] || node["tagteam:deonticCategory"] || node["tagteam:modalMarker"])),
  };
}

function countGraphEntities(graph) {
  return graph["@graph"].filter((node) => graphTypes(node).some((type) =>
    type === "tagteam:Entity" ||
    type === "tagteam:DiscourseReferent" ||
    type === "Organization" ||
    type === "Entity" ||
    type === "Person" ||
    type === "Agent" ||
    type === "MaterialEntity" ||
    type === "IndependentContinuant" ||
    type === "cco:Agent" ||
    type === "cco:Person" ||
    type === "obo:BFO_0000040"
  )).length;
}

function countGraphActs(graph) {
  return graph["@graph"].filter((node) => graphTypes(node).some((type) =>
    type === "tagteam:Act" ||
    type === "tagteam:VerbPhrase" ||
    type === "IntentionalAct" ||
    type === "Obligation" ||
    type === "DirectiveInformationContentEntity" ||
    type === "Process" ||
    type === "bfo:Process" ||
    type === "obo:BFO_0000015"
  )).length;
}

function graphTypes(node) {
  const type = node["@type"];
  if (Array.isArray(type)) return type.filter((item) => typeof item === "string");
  return typeof type === "string" ? [type] : [];
}

function tagTeamMetadata(output) {
  if (isObject(output) && isObject(output._metadata)) {
    return structuredClone(output._metadata);
  }
  return null;
}

function extractGraphNodes(tagTeamOutput) {
  if (Array.isArray(tagTeamOutput)) return tagTeamOutput.filter(isObject).map((node) => structuredClone(node));
  if (tagTeamOutput && Array.isArray(tagTeamOutput["@graph"])) {
    return tagTeamOutput["@graph"].filter(isObject).map((node) => structuredClone(node));
  }
  if (tagTeamOutput && isObject(tagTeamOutput)) return [structuredClone(tagTeamOutput)];
  throw new Error("TagTeam buildGraph returned an unsupported graph shape.");
}

function runtimeGraphContext(tagTeamOutput) {
  if (isObject(tagTeamOutput) && tagTeamOutput["@context"] !== undefined) {
    return [tagTeamGraphContext(), structuredClone(tagTeamOutput["@context"])];
  }
  return tagTeamGraphContext();
}

function contextCollisionWarnings(tagTeamOutput, recordId) {
  if (!isObject(tagTeamOutput) || !isObject(tagTeamOutput["@context"])) return [];
  const context = tagTeamOutput["@context"];
  const expected = coreContext();
  return Object.entries(expected)
    .filter(([term, iriValue]) => typeof iriValue === "string" && typeof context[term] === "string" && context[term] !== iriValue)
    .map(([term]) => makeWarning("sc:ContextCollision", `TagTeam output context remaps '${term}' differently than the SemantiCore context.`, recordId));
}

function getActiveRuntime() {
  const tagTeam = state.runtimeMode === "stub" ? null : window.TagTeam;
  if (tagTeam && typeof tagTeam.buildGraph === "function") {
    const version = typeof tagTeam.version === "string" ? tagTeam.version : "unknown";
    const ontologySupport = Boolean(tagTeam.OntologyTextTagger?.fromTTL);
    const warnings = runtimeOntologyWarnings(ontologySupport);
    let invocationDiagnostics = null;
    const adapter = createTagTeamRuntimeAdapter(tagTeam, {
      useOntologies: el.useOntologies.checked,
      onInvocation(diagnostics) {
        invocationDiagnostics = diagnostics;
      },
    });
    return {
      kind: "tagteam",
      version: adapter.version,
      warnings,
      diagnostics: runtimeDiagnostics("tagteam", version, ontologySupport, warnings),
      buildGraph(text, options, ontologySet) {
        const output = adapter.buildGraph(text, options, ontologySet);
        return {
          output,
          bridge: ontologyBridgeFromInvocation(invocationDiagnostics, ontologySet, ontologySupport, el.useOntologies.checked),
        };
      },
    };
  }

  const warnings = runtimeOntologyWarnings(false).filter((warning) => el.useOntologies.checked);
  return createFallbackRuntimeAdapter({
    warnings,
    diagnostics: runtimeDiagnostics("fallback", fallbackRuntimeVersion, false, warnings),
    useOntologies: el.useOntologies.checked,
  });
}

function createFallbackRuntimeAdapter(adapterOptions = {}) {
  return {
    kind: "fallback",
    version: fallbackRuntimeVersion,
    warnings: adapterOptions.warnings || [],
    diagnostics: adapterOptions.diagnostics,
    buildGraph(text, _options, ontologySet) {
      const bridge = ontologyBridgeBase(ontologySet);
      bridge.status = adapterOptions.useOntologies === false ? "sc:OntologyDisabled" : "sc:OntologyApiUnavailable";
      return {
        output: {
          "@context": coreContext(),
          "@graph": buildFallbackNodes(text),
        },
        bridge,
      };
    },
  };
}

function tagTeamOptions() {
  return {
    "@type": "sc:TagTeamOptions",
    "sc:ontologyThreshold": 0.2,
    "sc:verbose": false,
  };
}

function ontologyBridgeBase(ontologySet) {
  const enabled = enabledOntologies(ontologySet);
  return {
    status: "sc:OntologyDisabled",
    optionPassed: false,
    enabledOntologyCount: enabled.length,
    compiledOntologyCount: 0,
    ontologyContentBytes: 0,
  };
}

function ontologyBridgeFromInvocation(diagnostics, ontologySet, ontologySupport, useOntologies) {
  const bridge = ontologyBridgeBase(ontologySet);
  if (!useOntologies) return bridge;
  if (!ontologySupport) {
    bridge.status = "sc:OntologyApiUnavailable";
    return bridge;
  }
  bridge.status = bridge.enabledOntologyCount > 0 ? "sc:OntologyCompiledAndPassed" : "sc:NoEnabledOntologyContent";
  bridge.optionPassed = Boolean(diagnostics?.ontologyOptionPassed);
  bridge.compiledOntologyCount = Number(diagnostics?.compiledOntologyCount || 0);
  bridge.ontologyContentBytes = Number(diagnostics?.ontologyContentBytes || 0);
  bridge.tagTeamOptionKeys = diagnostics?.tagTeamOptionKeys || [];
  return bridge;
}

function ontologyBridgeReport(bridge, nodes) {
  return {
    "@type": "sc:OntologyBridgeReport",
    "sc:ontologyOptionStatus": { "@id": bridge.status || "sc:OntologyUnknown" },
    "sc:ontologyOptionPassed": Boolean(bridge.optionPassed),
    "sc:ontologyOptionKey": "ontology",
    "sc:ontologyCompileMode": { "@id": "sc:TagTeamDefaultPriorityChain" },
    "sc:enabledOntologyCount": Number(bridge.enabledOntologyCount || 0),
    "sc:compiledOntologyCount": Number(bridge.compiledOntologyCount || 0),
    "sc:ontologyContentBytes": Number(bridge.ontologyContentBytes || 0),
    "sc:tagTeamOptionKeys": bridge.tagTeamOptionKeys || [],
    "sc:ontologyMatchCount": countOntologyMatches(nodes),
  };
}

function countOntologyMatches(nodes) {
  return nodes.reduce((count, node) => {
    const matches = node.ontologyMatch || node["tagteam:ontologyMatch"];
    if (Array.isArray(matches)) return count + matches.length;
    return matches ? count + 1 : count;
  }, 0);
}

function enabledOntologies(ontologySet) {
  return (ontologySet?.["sc:ontologies"] || ontologySet?.ontologies || [])
    .filter((ontology) => ontology["sc:enabled"] && typeof ontology["sc:content"] === "string")
    .filter((ontology) => ontology["sc:content"].trim().length > 0);
}

function runtimeOntologyWarnings(ontologySupport) {
  const warnings = [];
  const enabled = buildOntologySet().ontologies.filter((ontology) => ontology["sc:enabled"]);
  if (enabled.length > 0 && !ontologySupport) {
    warnings.push(makeWarning("sc:OntologyUnavailable", "Enabled ontology TTL is visible but the active runtime does not expose OntologyTextTagger.fromTTL."));
  }
  enabled
    .filter((ontology) => ontology["sc:ontologyAlignment"]?.["@id"] !== "sc:CCO2BFO2020Aligned")
    .forEach((ontology) => {
      warnings.push(makeWarning("sc:NonCCOAlignedOntology", `Ontology ${ontology["@id"]} is not declared as CCO 2.0 / BFO 2020 aligned.`));
    });
  return warnings;
}

function runtimeDiagnostics(kind, version, ontologySupport, warnings) {
  return {
    "@context": coreContext(),
    "@id": "urn:semanticore:runtime:browser",
    "@type": kind === "tagteam" ? "sc:TagTeamRuntime" : "sc:DeterministicFallbackRuntime",
    "sc:runtimeMode": { "@id": state.runtimeMode === "stub" ? "sc:DeterministicFallback" : "sc:AutoDetectLocalRuntime" },
    "sc:tagTeamVersion": version,
    "sc:requiredTagTeamVersion": state.requiredTagTeamVersion,
    "sc:tagTeamVersionPolicy": { "@id": state.versionPolicy },
    "sc:ontologySupport": ontologySupport,
    "sc:enabledOntologyCount": buildOntologySet().ontologies.filter((ontology) => ontology["sc:enabled"]).length,
    "sc:warnings": warnings,
  };
}

function evaluateVersionPolicy(runtimeVersion) {
  const required = state.requiredTagTeamVersion || fallbackRuntimeVersion;
  const exactMatch = runtimeVersion === required;
  let canRun = exactMatch;
  if (state.versionPolicy === "sc:WarnAndRunOnMismatch") {
    canRun = true;
  }
  if (state.versionPolicy === "sc:AllowCompatibleMinor") {
    canRun = isCompatibleMinor(required, runtimeVersion);
  }
  const warnings = exactMatch || canRun && state.versionPolicy !== "sc:WarnAndRunOnMismatch" ? [] : [
    makeWarning("sc:TagTeamVersionMismatch", `TagTeam runtime version ${runtimeVersion} does not satisfy required version ${required} under ${state.versionPolicy}.`),
  ];
  if (!canRun && warnings.length === 0) {
    warnings.push(makeWarning("sc:TagTeamVersionMismatch", `TagTeam runtime version ${runtimeVersion} does not satisfy required version ${required} under ${state.versionPolicy}.`));
  }
  return { canRun, warnings };
}

function isCompatibleMinor(required, actual) {
  const requiredParts = parseSemver(required);
  const actualParts = parseSemver(actual);
  return Boolean(
    requiredParts &&
    actualParts &&
    requiredParts.major === actualParts.major &&
    actualParts.minor >= requiredParts.minor,
  );
}

function parseSemver(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function csvToDataset(text, mappingManifest) {
  const rows = parseCsv(text);
  const headers = mappingManifest["sc:hasHeaderRow"] ? rows[0] || [] : (rows[0] || []).map((_value, index) => String(index));
  const dataRows = mappingManifest["sc:hasHeaderRow"] ? rows.slice(1) : rows;
  const records = dataRows.map((row, index) => {
    const source = {};
    mappingManifest.columnMappings.forEach((mapping) => {
      const columnIndex = headers.indexOf(mapping["sc:sourceColumn"]);
      source[mapping["sc:targetProperty"]["@id"]] = columnIndex >= 0 ? row[columnIndex] || "" : "";
    });
    return makeRecord(index, source);
  });
  return makeDataset(records, mappingManifest);
}

function jsonToDataset(input, mappingManifest, pointer) {
  const selected = pointer ? resolveJsonPointer(input, pointer) : input;
  const rows = Array.isArray(selected) ? selected : [selected];
  if (!rows.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
    throw new Error("JSON input must resolve to an object or array of objects.");
  }
  const records = rows.map((row, index) => {
    const source = {};
    mappingManifest.columnMappings.forEach((mapping) => {
      const value = row[mapping["sc:sourceColumn"]];
      source[mapping["sc:targetProperty"]["@id"]] = typeof value === "string" ? value : JSON.stringify(value ?? "");
    });
    return makeRecord(index, source);
  });
  return makeDataset(records, mappingManifest);
}

function jsonLdToDataset(input) {
  if (input?.["@type"] === "sc:Dataset" && Array.isArray(input["sc:records"])) {
    const badRecord = input["sc:records"].find((record) => !record["@id"] || record["@id"].startsWith("_:"));
    if (badRecord) throw new Error("JSON-LD records must have stable non-blank @id values.");
    return structuredClone(input);
  }
  throw new Error("JSON-LD input must be a sc:Dataset with sc:records.");
}

function makeDataset(records, mappingManifest) {
  return {
    "@context": {
      ...coreContext(),
      records: { "@id": "sc:records", "@container": "@list" },
    },
    "@id": "urn:semanticore:dataset:browser-demo",
    "@type": "sc:Dataset",
    "schema:name": "Browser demo dataset",
    "sc:recordIdStrategy": { "@id": "sc:RowIndexRecordId" },
    "sc:mappingManifest": { "@id": mappingManifest["@id"] },
    "sc:records": records,
  };
}

function makeRecord(index, source) {
  return {
    "@id": `urn:semanticore:record:browser-demo:${index}`,
    "@type": "sc:SourceRecord",
    "sc:source": source,
  };
}

function buildMappingManifest() {
  return {
    "@context": coreContext(),
    "@id": "urn:semanticore:mapping:browser-demo",
    "@type": "sc:MappingManifest",
    "sc:sourceFormat": { "@id": `sc:${state.format.toUpperCase()}` },
    "sc:hasHeaderRow": el.hasHeaderRow.checked,
    "sc:recordIdStrategy": { "@id": "sc:RowIndexRecordId" },
    "sc:mappingInference": { "@id": "sc:ExplicitMapping" },
    "sc:tagTeamSourcePropertyPath": {
      "@type": "sc:PropertyPath",
      "sc:path": [{ "@id": "sc:source" }, { "@id": selectedTagTeamSourceProperty() }],
      "sc:multiValuePolicy": { "@id": "sc:EnrichEachValue" },
    },
    columnMappings: state.mappingRows.map((row) => ({
      "@type": "sc:ColumnMapping",
      "sc:sourceColumn": row.sourceColumn,
      "sc:targetProperty": { "@id": row.targetProperty },
      "sc:valueDatatype": { "@id": "xsd:string" },
    })),
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index++;
      row.push(cell);
      if (row.some((item) => item.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((item) => item.length > 0)) rows.push(row);
  return rows;
}

function inferCsvMappings(text) {
  const [headers = []] = parseCsv(text);
  return headers
    .map((header) => header.trim())
    .filter(Boolean)
    .map((header) => ({
      sourceColumn: header,
      targetProperty: inferredPropertyForHeader(header),
    }));
}

function inferredPropertyForHeader(header) {
  const normalized = header.trim().toLowerCase().replace(/[\s_-]+/g, "");
  const knownProperties = {
    text: "schema:text",
    body: "schema:text",
    content: "schema:text",
    url: "schema:url",
    uri: "schema:url",
    link: "schema:url",
    id: "schema:identifier",
    identifier: "schema:identifier",
    createdat: "schema:dateCreated",
    created: "schema:dateCreated",
    datecreated: "schema:dateCreated",
    timestamp: "schema:dateCreated",
    title: "schema:name",
    name: "schema:name",
    description: "schema:text",
  };
  return knownProperties[normalized] || `schema:${normalized || "value"}`;
}

function resolveJsonPointer(input, pointer) {
  if (pointer === "") return input;
  if (!pointer.startsWith("/")) throw new Error("JSON Pointer must start with '/'.");
  return pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce((current, segment) => {
      if (Array.isArray(current)) return current[Number(segment)];
      if (current && typeof current === "object" && segment in current) return current[segment];
      throw new Error(`JSON Pointer segment '${segment}' does not resolve.`);
    }, input);
}

function renderAll() {
  renderStats();
  renderMappingPreview();
  renderOntology();
  renderContext();
  renderSession();
  renderRuntime();
  renderResults();
  renderSelectedGraph();
  renderOutput();
}

function renderMapping() {
  el.mappingRows.innerHTML = "";
  state.mappingRows.forEach((row, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "mapping-row";
    wrapper.innerHTML = `
      <input type="text" value="${escapeAttribute(row.sourceColumn)}" aria-label="Source field ${index + 1}" data-source-index="${index}">
      <input type="text" value="${escapeAttribute(row.targetProperty)}" aria-label="JSON-LD property ${index + 1}" data-target-index="${index}">
      <button type="button" data-remove-index="${index}" aria-label="Remove mapping ${index + 1}">Remove</button>
    `;
    el.mappingRows.appendChild(wrapper);
  });
  el.mappingRows.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      readMappingRows();
      syncTagTeamSourceSelection();
      renderMappingPreview();
      renderSourcePath();
    });
  });
  el.mappingRows.querySelectorAll("[data-remove-index]").forEach((button) => {
    button.addEventListener("click", () => {
      readMappingRows();
      state.mappingRows.splice(Number(button.dataset.removeIndex), 1);
      syncTagTeamSourceSelection();
      renderMapping();
    });
  });
  syncTagTeamSourceSelection();
  renderMappingPreview();
  renderSourcePath();
}

function readMappingRows() {
  const rows = [];
  el.mappingRows.querySelectorAll(".mapping-row").forEach((row) => {
    const source = row.querySelector("[data-source-index]").value.trim();
    const target = row.querySelector("[data-target-index]").value.trim();
    if (source || target) rows.push({ sourceColumn: source, targetProperty: target });
  });
  state.mappingRows = rows.length > 0 ? rows : [{ sourceColumn: "Text", targetProperty: "schema:text" }];
}

function renderMappingPreview() {
  state.mappingManifest = buildMappingManifest();
  el.mappingPreview.textContent = stableStringify(state.mappingManifest, 2);
}

function syncTagTeamSourceSelection() {
  const options = tagTeamSourceOptions();
  const visibleOptions = options.length > 0 ? options : [{ sourceColumn: "Text", targetProperty: "schema:text" }];
  const current = options.find((option) => option.targetProperty === state.tagTeamSourceProperty)
    ? state.tagTeamSourceProperty
    : preferredTagTeamSourceProperty(visibleOptions);
  state.tagTeamSourceProperty = current;
  el.tagTeamSourceSelect.innerHTML = visibleOptions.map((option) => `
    <option value="${escapeAttribute(option.targetProperty)}" ${option.targetProperty === current ? "selected" : ""}>
      ${escapeHtml(option.sourceColumn || option.targetProperty)} -> ${escapeHtml(option.targetProperty)}
    </option>
  `).join("");
}

function tagTeamSourceOptions() {
  return state.mappingRows
    .filter((row) => row.targetProperty && row.sourceColumn)
    .map((row) => ({
      sourceColumn: row.sourceColumn,
      targetProperty: row.targetProperty,
    }));
}

function preferredTagTeamSourceProperty(options) {
  return options.find((option) => option.targetProperty === "schema:text")?.targetProperty ||
    options.find((option) => option.sourceColumn.toLowerCase() === "text")?.targetProperty ||
    options[0]?.targetProperty ||
    "schema:text";
}

function selectedTagTeamSourceProperty() {
  return state.tagTeamSourceProperty || "schema:text";
}

function renderStats() {
  const records = runRecords() || state.dataset?.["sc:records"] || [];
  el.recordCount.textContent = String(records.length);
  el.enrichedCount.textContent = String((runRecords() || []).filter((record) => {
    const enrichment = record["sc:semanticEnrichment"];
    return enrichment?.["sc:status"]?.["@id"] === "sc:EnrichmentSucceeded";
  }).length);
  el.warningCount.textContent = String(runWarnings().length);
  el.graphCount.textContent = String(runGraphs().length);
}

function renderSourcePath() {
  el.sourcePath.textContent = `sc:source / ${selectedTagTeamSourceProperty()}`;
}

function renderResults() {
  const records = runRecords() || state.dataset?.["sc:records"] || [];
  if (records.length === 0) {
    el.resultsBody.innerHTML = '<tr><td colspan="7">No records yet.</td></tr>';
    return;
  }
  el.resultsBody.innerHTML = records.map((record) => {
    const enrichment = record["sc:semanticEnrichment"];
    const summary = enrichment?.["sc:summary"];
    const recordWarnings = runWarnings()
      .filter((warning) => warning["sc:record"]?.["@id"] === record["@id"])
      .map((warning) => warning["sc:code"]["@id"])
      .join(" ");
    return `
      <tr>
        <td><code>${escapeHtml(record["@id"])}</code></td>
        <td>${escapeHtml(enrichment?.["sc:status"]?.["@id"] || "sc:SourceRecord")}</td>
        <td>${escapeHtml(enrichment?.["sc:sourceText"] || firstSourceText(record) || "")}</td>
        <td>${summary?.["sc:entityCount"] ?? 0}</td>
        <td>${summary?.["sc:actCount"] ?? 0}</td>
        <td><code>${escapeHtml(enrichment?.["sc:namedGraph"]?.["@id"] || "")}</code></td>
        <td>${escapeHtml(recordWarnings)}</td>
      </tr>
    `;
  }).join("");
}

function renderOutput() {
  el.outputPreview.textContent = exportFor(state.outputView);
}

function renderSelectedGraph() {
  const graph = runGraphs()[0];
  if (!graph) {
    el.graphFocusSummary.textContent = "Run enrichment to inspect the first TagTeam graph directly.";
    el.selectedGraphPreview.textContent = "";
    return;
  }
  const metadata = graph["sc:tagTeamMetadata"] || {};
  const nodes = Array.isArray(graph["@graph"]) ? graph["@graph"].length : 0;
  const runtimeKind = graph["sc:runtimeKind"]?.["@id"] || "sc:UnknownRuntime";
  const recordId = graph["sc:graphForRecord"]?.["@id"] || "unknown record";
  const entityCount = metadata.entities ?? countGraphEntities(graph);
  const actCount = metadata.acts ?? countGraphActs(graph);
  el.graphFocusSummary.textContent = `${recordId} | ${runtimeKind} | ${nodes} graph node(s), ${entityCount} entit(y/ies), ${actCount} act(s).`;
  el.selectedGraphPreview.textContent = stableStringify(graph, 2);
}

function exportFor(kind) {
  if (kind === "dataset") return stableStringify(state.dataset || {}, 2);
  if (kind === "enriched" || kind === "jsonld") return stableStringify(state.run || {}, 2);
  if (kind === "graphs") {
    return stableStringify({
      "@context": tagTeamGraphContext(),
      "@id": "urn:semanticore:graph-bundle:browser-demo",
      "@type": "sc:GraphBundle",
      "schema:name": "TagTeam JSON-LD graph bundle",
      "sc:graphs": runGraphs(),
    }, 2);
  }
  if (kind === "warnings") return stableStringify(runWarnings(), 2);
  if (kind === "csv") return csvSummary();
  if (kind === "hashes") return stableStringify(canonicalHashReport(), 2);
  if (kind === "session") return stableStringify(buildSessionSnapshot(), 2);
  return "";
}

function canonicalHashReport() {
  return {
    "@context": coreContext(),
    "@id": "urn:semanticore:hash-report:browser-demo",
    "@type": "sc:CanonicalHashReport",
    "sc:canonicalizationAlgorithm": "sc:SortedKeyCanonicalJsonEnvelope",
    "sc:hashAlgorithm": "sha256",
    "sc:dataset": hashReference(state.dataset, "urn:semanticore:dataset:none"),
    "sc:run": hashReference(state.run, "urn:semanticore:run:none"),
    "sc:graphBundle": hashReference({
      "@context": tagTeamGraphContext(),
      "@id": "urn:semanticore:graph-bundle:browser-demo",
      "@type": "sc:GraphBundle",
      "schema:name": "TagTeam JSON-LD graph bundle",
      "sc:graphs": runGraphs(),
    }, "urn:semanticore:graph-bundle:none"),
    "sc:warnings": {
      "@id": "urn:semanticore:warnings:browser-demo",
      "sc:contentHash": canonicalContentHash(runWarnings()),
    },
  };
}

function csvSummary() {
  const header = "recordId,enrichmentStatus,sourceText,entityCount,actCount,roleCount,deonticDetected,namedGraphId,warningErrorCodes";
  const rows = runRecords().map((record) => {
    const enrichment = record["sc:semanticEnrichment"] || {};
    const summary = enrichment["sc:summary"] || {};
    const warningCodes = runWarnings()
      .filter((warning) => warning["sc:record"]?.["@id"] === record["@id"])
      .map((warning) => warning["sc:code"]["@id"])
      .join(" ");
    return [
      record["@id"],
      enrichment["sc:status"]?.["@id"] || "sc:EnrichmentSkipped",
      enrichment["sc:sourceText"] || "",
      String(summary["sc:entityCount"] || 0),
      String(summary["sc:actCount"] || 0),
      String(summary["sc:roleCount"] || 0),
      String(summary["sc:deonticDetected"] || false),
      enrichment["sc:namedGraph"]?.["@id"] || "",
      warningCodes,
    ].map(escapeCsvCell).join(",");
  });
  return `${[header, ...rows].join("\n")}\n`;
}

function runRecords() {
  return state.run?.["sc:records"] || [];
}

function runGraphs() {
  return state.run?.["sc:graphs"] || [];
}

function runWarnings() {
  return state.run?.["sc:warnings"] || [];
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function saveSession() {
  readMappingRows();
  state.mappingManifest = buildMappingManifest();
  state.contextManifest = buildContextManifest();
  state.ontologySet = buildOntologySet();
  const snapshot = buildSessionSnapshot();
  state.savedSession = snapshot;
  try {
    await idbPut("sessions", snapshot["@id"], snapshot);
    localStorage.setItem("semanticore-session-fallback", stableStringify(snapshot));
    el.sessionStatus.textContent = `Saved locally with IndexedDB hash ${snapshot["sc:contentHash"]}.`;
  } catch (error) {
    localStorage.setItem("semanticore-session-fallback", stableStringify(snapshot));
    el.sessionStatus.textContent = `Saved locally with fallback storage hash ${snapshot["sc:contentHash"]}.`;
  }
  renderSession();
}

async function restoreSession() {
  let snapshot = null;
  try {
    snapshot = await idbGet("sessions", "urn:semanticore:session:browser-demo");
  } catch {
    snapshot = null;
  }
  if (!snapshot) {
    const fallback = localStorage.getItem("semanticore-session-fallback");
    snapshot = fallback ? JSON.parse(fallback) : null;
  }
  if (!snapshot) {
    el.sessionStatus.textContent = "No local session found.";
    return;
  }
  state.savedSession = snapshot;
  state.format = snapshot["sc:snapshot"]["sc:format"] || "csv";
  state.mappingRows = snapshot["sc:snapshot"]["sc:mappingRows"] || state.mappingRows;
  state.mappingManifest = snapshot["sc:snapshot"]["sc:mappingManifest"] || null;
  state.tagTeamSourceProperty = snapshot["sc:snapshot"]["sc:tagTeamSourceProperty"] ||
    state.mappingManifest?.["sc:tagTeamSourcePropertyPath"]?.["sc:path"]?.[1]?.["@id"] ||
    state.tagTeamSourceProperty;
  state.dataset = snapshot["sc:snapshot"]["sc:dataset"] || null;
  state.run = snapshot["sc:snapshot"]["sc:run"] || null;
  state.ontologySet = snapshot["sc:snapshot"]["sc:ontologySet"] || defaultOntologySet();
  state.contextManifest = snapshot["sc:snapshot"]["sc:contextManifest"] || buildContextManifest();
  state.runtime = snapshot["sc:snapshot"]["sc:runtime"] || null;
  state.runtimeMode = snapshot["sc:snapshot"]["sc:runtimeMode"] || "auto";
  state.requiredTagTeamVersion = snapshot["sc:snapshot"]["sc:requiredTagTeamVersion"] || fallbackRuntimeVersion;
  state.versionPolicy = snapshot["sc:snapshot"]["sc:tagTeamVersionPolicy"] || "sc:RejectOnMismatch";

  el.formatSelect.value = state.format;
  el.sourceInput.value = snapshot["sc:snapshot"]["sc:sourceText"] || "";
  el.hasHeaderRow.checked = snapshot["sc:snapshot"]["sc:hasHeaderRow"] !== false;
  el.jsonPointer.value = snapshot["sc:snapshot"]["sc:jsonPointer"] || "/records";
  el.runtimeMode.value = state.runtimeMode;
  el.requiredVersion.value = state.requiredTagTeamVersion;
  el.versionPolicy.value = state.versionPolicy;
  renderMapping();
  renderOntology();
  renderAll();
  el.sessionStatus.textContent = `Restored local session ${snapshot["@id"]}.`;
}

async function clearSession() {
  try {
    await idbDelete("sessions", "urn:semanticore:session:browser-demo");
  } catch {
    // Fallback storage is cleared below; IndexedDB can be unavailable in hardened browsers.
  }
  localStorage.removeItem("semanticore-session-fallback");
  state.savedSession = null;
  el.sessionStatus.textContent = "Local session cleared.";
  renderSession();
}

function addOntology() {
  const content = el.ontologyContent.value.trim();
  const title = el.ontologyName.value.trim() || "Untitled ontology";
  addOntologyEntry(title, content, el.ontologyAlignment.value);
}

async function importOntologyFile() {
  const file = el.ontologyFileInput.files?.[0];
  if (!file) return;
  try {
    const content = await file.text();
    const title = file.name.replace(/\.(ttl|turtle)$/i, "") || "Imported ontology";
    el.ontologyName.value = title;
    el.ontologyContent.value = content;
    addOntologyEntry(title, content, el.ontologyAlignment.value);
    el.ontologyFileInput.value = "";
  } catch (error) {
    el.runtimeStatus.innerHTML = `<span class="danger">${escapeHtml(error.message || String(error))}</span>`;
  }
}

function addOntologyEntry(title, content, alignment) {
  if (!state.ontologySet) state.ontologySet = defaultOntologySet();
  const trimmedContent = content.trim();
  if (!trimmedContent) return;
  const id = `urn:semanticore:ontology:${stableFragment(title)}:${state.ontologySet.ontologies.length}`;
  state.ontologySet.ontologies.push({
    "@id": id,
    "@type": "sc:LocalOntology",
    "dcterms:title": title,
    "sc:enabled": true,
    "sc:mediaType": "text/turtle",
    "sc:contentHash": textContentHash(trimmedContent),
    "sc:content": trimmedContent,
    "sc:ontologyAlignment": { "@id": alignment },
  });
  renderOntology();
  refreshRuntimeStatus(`Ontology ${title} added locally.`);
  renderSession();
}

function buildSessionSnapshot() {
  const snapshot = {
    "sc:format": state.format,
    "sc:sourceText": el.sourceInput.value,
    "sc:hasHeaderRow": el.hasHeaderRow.checked,
    "sc:jsonPointer": el.jsonPointer.value,
    "sc:mappingRows": state.mappingRows,
    "sc:tagTeamSourceProperty": selectedTagTeamSourceProperty(),
    "sc:mappingManifest": state.mappingManifest || buildMappingManifest(),
    "sc:dataset": state.dataset,
    "sc:run": state.run,
    "sc:ontologySet": state.ontologySet || defaultOntologySet(),
    "sc:contextManifest": state.contextManifest || buildContextManifest(),
    "sc:runtime": state.runtime || getActiveRuntime().diagnostics,
    "sc:runtimeMode": state.runtimeMode,
    "sc:requiredTagTeamVersion": state.requiredTagTeamVersion,
    "sc:tagTeamVersionPolicy": state.versionPolicy,
  };
  const contentHash = canonicalContentHash(snapshot);
  return {
    "@context": coreContext(),
    "@id": "urn:semanticore:session:browser-demo",
    "@type": "sc:Session",
    "sc:contentHash": contentHash,
    "sc:dataset": hashReference(snapshot["sc:dataset"], "urn:semanticore:dataset:none"),
    "sc:configuration": {
      "@id": "urn:semanticore:config:browser-demo",
      "sc:contentHash": canonicalContentHash(snapshot["sc:mappingManifest"]),
    },
    "sc:contextManifest": hashReference(snapshot["sc:contextManifest"], "urn:semanticore:context-manifest:browser-demo"),
    "sc:ontologySet": hashReference(snapshot["sc:ontologySet"], "urn:semanticore:ontology-set:browser-demo"),
    "sc:snapshot": snapshot,
  };
}

function hashReference(document, fallbackId) {
  return {
    "@id": document?.["@id"] || fallbackId,
    "sc:contentHash": canonicalContentHash(document || {}),
  };
}

function renderSession() {
  const snapshot = state.savedSession || buildSessionSnapshot();
  el.sessionPreview.textContent = stableStringify(snapshot, 2);
}

function renderOntology() {
  if (!state.ontologySet) state.ontologySet = defaultOntologySet();
  el.ontologyList.innerHTML = state.ontologySet.ontologies.map((ontology, index) => `
    <label class="ontology-item">
      <input type="checkbox" ${ontology["sc:enabled"] ? "checked" : ""} data-ontology-index="${index}">
      <span>${escapeHtml(ontology["dcterms:title"] || ontology["@id"])}</span>
      <code>${escapeHtml(ontology["sc:ontologyAlignment"]?.["@id"] || "sc:NotDeclaredCCOAligned")}</code>
    </label>
  `).join("");
  el.ontologyList.querySelectorAll("[data-ontology-index]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      state.ontologySet.ontologies[Number(checkbox.dataset.ontologyIndex)]["sc:enabled"] = checkbox.checked;
      renderOntology();
      renderSession();
    });
  });
  el.ontologyPreview.textContent = stableStringify(buildOntologySet(), 2);
}

function renderContext() {
  state.contextManifest = buildContextManifest();
  el.contextPreview.textContent = stableStringify(state.contextManifest, 2);
}

async function loadLocalTagTeamBundle() {
  const file = el.tagTeamBundleInput.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const url = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    await injectScript(url);
    URL.revokeObjectURL(url);
    state.runtimeMode = "auto";
    el.runtimeMode.value = "auto";
    refreshRuntimeStatus(`${file.name} loaded into this browser tab.`);
  } catch (error) {
    el.runtimeStatus.innerHTML = `<span class="danger">${escapeHtml(error.message || String(error))}</span>`;
    renderRuntime();
  }
}

function injectScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => {
      script.remove();
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("The selected TagTeam bundle could not be executed."));
    };
    document.head.appendChild(script);
  });
}

function refreshRuntimeStatus(message) {
  state.runtimeMode = el.runtimeMode.value;
  state.requiredTagTeamVersion = el.requiredVersion.value.trim() || fallbackRuntimeVersion;
  state.versionPolicy = el.versionPolicy.value;
  const runtime = getActiveRuntime();
  state.runtime = runtime.diagnostics;
  state.runtimeWarnings = runtime.warnings;
  const versionDecision = evaluateVersionPolicy(runtime.version);
  const label = runtime.kind === "tagteam" ? `TagTeam ${runtime.version}` : "deterministic fallback runtime";
  const decision = versionDecision.canRun ? "can run" : "is blocked by version policy";
  el.runtimeStatus.textContent = `${message} Active runtime: ${label}; ${decision}.`;
  renderRuntime();
}

function renderRuntime() {
  const runtime = getActiveRuntime();
  const versionDecision = evaluateVersionPolicy(runtime.version);
  state.runtime = runtime.diagnostics;
  state.runtimeWarnings = runtime.warnings;
  el.runtimePreview.textContent = stableStringify({
    ...runtime.diagnostics,
    "sc:versionDecision": {
      "@type": "sc:VersionDecision",
      "sc:canRun": versionDecision.canRun,
      "sc:warnings": versionDecision.warnings,
    },
  }, 2);
  if (!el.runtimeStatus.textContent || el.runtimeStatus.textContent === "No runtime detection has run yet.") {
    const label = runtime.kind === "tagteam" ? `TagTeam ${runtime.version}` : "deterministic fallback runtime";
    el.runtimeStatus.textContent = `Active runtime: ${label}.`;
  }
}

function buildOntologySet() {
  if (!state.ontologySet) state.ontologySet = defaultOntologySet();
  return {
    "@context": coreContext(),
    "@id": "urn:semanticore:ontology-set:browser-demo",
    "@type": "sc:OntologySet",
    "sc:ontologyCompositionPolicy": { "@id": "sc:OrderedUnion" },
    ontologies: state.ontologySet.ontologies.map((ontology) => ({ ...ontology })),
  };
}

function defaultOntologySet() {
  const defaultContent = "@prefix ex: <urn:example:> .\nex:Notice a ex:InformationContentEntity .";
  return {
    "@id": "urn:semanticore:ontology-set:browser-demo",
    "@type": "sc:OntologySet",
    ontologies: [
      {
        "@id": "urn:semanticore:ontology:browser-default",
        "@type": "sc:LocalOntology",
        "dcterms:title": "Browser default policy vocabulary",
        "sc:enabled": false,
        "sc:mediaType": "text/turtle",
        "sc:contentHash": textContentHash(defaultContent),
        "sc:content": defaultContent,
        "sc:ontologyAlignment": { "@id": "sc:CCO2BFO2020Aligned" },
      },
    ],
  };
}

function buildContextManifest() {
  const contextDocument = {
    "@context": {
      sc: "https://semanticore.fandaws.org/ns/",
      schema: "https://schema.org/",
      tagteam: "https://tagteam.fandaws.org/ontology/",
      text: "schema:text",
      url: "schema:url",
      identifier: "schema:identifier",
      dateCreated: "schema:dateCreated",
      name: "schema:name",
      source: "sc:source",
    },
  };
  return {
    "@context": coreContext(),
    "@id": "urn:semanticore:context-manifest:browser-demo",
    "@type": "sc:ContextManifest",
    contexts: [
      {
        "@id": "urn:semanticore:context:browser-core",
        "@type": "sc:LocalContext",
        "sc:contentHash": canonicalContentHash(contextDocument),
        "sc:contextDocument": contextDocument,
      },
    ],
  };
}

function idbOpen() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("semanticore-local-state", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(storeName, key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function idbGet(storeName, key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function idbDelete(storeName, key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

function firstSourceText(record) {
  const source = record["sc:source"] || {};
  return source[selectedTagTeamSourceProperty()] || "";
}

function makeWarning(code, message, recordId = "") {
  const warning = {
    "@id": `urn:semanticore:warning:${stableFragment(recordId || "browser")}:${stableFragment(code)}`,
    "@type": "sc:Warning",
    "sc:code": { "@id": code },
    "sc:message": message,
    "sc:recoverable": true,
  };
  if (recordId) warning["sc:record"] = { "@id": recordId };
  return warning;
}

function coreContext() {
  return {
    sc: "https://semanticore.fandaws.org/ns/",
    tagteam: "https://tagteam.fandaws.org/ontology/",
    schema: "https://schema.org/",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    "sc:code": { "@type": "@id" },
    "sc:record": { "@type": "@id" },
    "sc:status": { "@type": "@id" },
    "sc:namedGraph": { "@type": "@id" },
  };
}

function tagTeamGraphContext() {
  return {
    ...coreContext(),
    inst: "urn:tagteam:instance:",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    owl: "http://www.w3.org/2002/07/owl#",
    is_about: { "@id": "tagteam:is_about", "@type": "@id" },
    is_concretized_by: { "@id": "tagteam:is_concretized_by", "@type": "@id" },
    is_subject_of: { "@id": "tagteam:is_subject_of", "@type": "@id" },
    is_bearer_of: { "@id": "tagteam:is_bearer_of", "@type": "@id", "@container": "@set" },
    has_input: { "@id": "tagteam:has_input", "@type": "@id" },
    has_agent: { "@id": "tagteam:has_agent", "@type": "@id" },
    has_output: { "@id": "tagteam:has_output", "@type": "@id" },
    prescribes: { "@id": "tagteam:prescribes", "@type": "@id" },
    is_prescribed_by: { "@id": "tagteam:is_prescribed_by", "@type": "@id" },
    isSpecifiedBy: { "@id": "tagteam:isSpecifiedBy", "@type": "@id" },
    inheres_in: { "@id": "tagteam:inheres_in", "@type": "@id" },
    realized_in: { "@id": "tagteam:realized_in", "@type": "@id" },
    has_text_value: "tagteam:has_text_value",
    ontologyMatch: { "@id": "tagteam:ontologyMatch", "@container": "@set" },
    ontologyMatchIRI: { "@id": "tagteam:ontologyMatchIRI", "@type": "@id" },
    ontologyMatchConfidence: { "@id": "tagteam:ontologyMatchConfidence", "@type": "xsd:decimal" },
    ontologyMatchEvidence: "tagteam:ontologyMatchEvidence",
    ontologyMatchLabel: "tagteam:ontologyMatchLabel",
    ontologyMatchType: "tagteam:ontologyMatchType",
    ontologyMatchForm: "tagteam:ontologyMatchForm",
    ontologyMatchInflection: "tagteam:ontologyMatchInflection",
    ontologyMatchOWLType: { "@id": "tagteam:ontologyMatchOWLType", "@type": "@id" },
    "tagteam:classNominationStatus": { "@type": "@id" },
    ActSpecification: "tagteam:ActSpecification",
    Agent: "tagteam:Agent",
    DirectiveInformationContentEntity: "tagteam:DirectiveInformationContentEntity",
    Entity: "tagteam:Entity",
    EventDescription: "tagteam:EventDescription",
    InformationBearingEntity: "tagteam:InformationBearingEntity",
    InformationContentEntity: "tagteam:InformationContentEntity",
    IntentionalAct: "tagteam:IntentionalAct",
    Obligation: "tagteam:Obligation",
    Organization: "tagteam:Organization",
    Permission: "tagteam:Permission",
    Person: "tagteam:Person",
    PlanSpecification: "tagteam:PlanSpecification",
    Process: "tagteam:Process",
    Role: "tagteam:Role",
  };
}

function stableStringify(value, spaces = 0) {
  return JSON.stringify(sortJson(value), null, spaces);
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortJson(value[key])]));
  }
  return value;
}

function stableFragment(value) {
  return String(value).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "id";
}

function canonicalContentHash(value) {
  return textContentHash(stableStringify(value));
}

function textContentHash(value) {
  return `sha256:${sha256Hex(utf8Bytes(value))}`;
}

function utf8Bytes(value) {
  return new TextEncoder().encode(value);
}

function sha256Hex(bytes) {
  return Array.from(sha256(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const sha256InitialState = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

const sha256RoundConstants = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256(input) {
  const padded = padSha256Input(input);
  const hash = [...sha256InitialState];
  const words = new Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index++) {
      const byteOffset = offset + index * 4;
      words[index] =
        (padded[byteOffset] << 24) |
        (padded[byteOffset + 1] << 16) |
        (padded[byteOffset + 2] << 8) |
        padded[byteOffset + 3];
    }
    for (let index = 16; index < 64; index++) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = add32(words[index - 16], s0, words[index - 7], s1);
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index++) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = add32(h, s1, choice, sha256RoundConstants[index], words[index]);
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = add32(s0, majority);
      h = g;
      g = f;
      f = e;
      e = add32(d, temp1);
      d = c;
      c = b;
      b = a;
      a = add32(temp1, temp2);
    }

    hash[0] = add32(hash[0], a);
    hash[1] = add32(hash[1], b);
    hash[2] = add32(hash[2], c);
    hash[3] = add32(hash[3], d);
    hash[4] = add32(hash[4], e);
    hash[5] = add32(hash[5], f);
    hash[6] = add32(hash[6], g);
    hash[7] = add32(hash[7], h);
  }

  const output = new Uint8Array(32);
  hash.forEach((word, index) => {
    output[index * 4] = word >>> 24;
    output[index * 4 + 1] = word >>> 16;
    output[index * 4 + 2] = word >>> 8;
    output[index * 4 + 3] = word;
  });
  return output;
}

function padSha256Input(input) {
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);
  return padded;
}

function rotateRight(value, bits) {
  return (value >>> bits) | (value << (32 - bits));
}

function add32(...values) {
  return values.reduce((sum, value) => (sum + value) >>> 0, 0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function escapeCsvCell(value) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

state.ontologySet = defaultOntologySet();
state.contextManifest = buildContextManifest();
state.runtime = getActiveRuntime().diagnostics;
renderMapping();
el.sourceInput.value = sampleCsv;
normalize();
refreshRuntimeStatus("Runtime initialized.");
