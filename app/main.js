const phaseLabel = "Phase 5";
const fallbackRuntimeVersion = "7.0.0";

const sampleCsv = `description,title,source
The agency shall publish the notice.,Publication duty,Regulation A
The committee may review the proposal.,Review authority,Policy B
The officer must record the decision.,Recordkeeping duty,Procedure C`;

const state = {
  format: "csv",
  mappingRows: [
    { sourceColumn: "description", targetProperty: "schema:description" },
    { sourceColumn: "title", targetProperty: "schema:name" },
  ],
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
  resultsBody: document.querySelector("#resultsBody"),
  outputPreview: document.querySelector("#outputPreview"),
  saveSession: document.querySelector("#saveSession"),
  restoreSession: document.querySelector("#restoreSession"),
  clearSession: document.querySelector("#clearSession"),
  sessionStatus: document.querySelector("#sessionStatus"),
  sessionPreview: document.querySelector("#sessionPreview"),
  addOntology: document.querySelector("#addOntology"),
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
  el.inputStatus.textContent = `${file.name} loaded locally.`;
  normalize();
});

el.formatSelect.addEventListener("change", () => {
  state.format = el.formatSelect.value;
  renderMapping();
});

el.addMapping.addEventListener("click", () => {
  readMappingRows();
  state.mappingRows.push({ sourceColumn: "", targetProperty: "schema:description" });
  renderMapping();
});

el.normalizeData.addEventListener("click", normalize);
el.runEnrichment.addEventListener("click", runEnrichment);
el.saveSession.addEventListener("click", saveSession);
el.restoreSession.addEventListener("click", restoreSession);
el.clearSession.addEventListener("click", clearSession);
el.addOntology.addEventListener("click", addOntology);
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
      records: [],
      graphs: [],
      warnings: [makeWarning("sc:UnsupportedInputShape", error.message || String(error))],
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
    records,
    graphs,
    warnings,
  };
  const runtimeLabel = runtime.kind === "tagteam" ? `TagTeam ${runtime.version}` : "deterministic fallback runtime";
  el.inputStatus.textContent = `Enriched ${records.length} record(s) locally with ${runtimeLabel}.`;
  renderAll();
}

function enrichRecord(record, index, runtime, versionDecision) {
  const warnings = [];
  const sourceProperty = firstTextProperty();
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
      "sc:path": [{ "@id": "sc:source" }, { "@id": firstTextProperty() }],
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
  const output = runtime.buildGraph(text, buildTagTeamOptions());
  const nodes = extractGraphNodes(output);
  return {
    graph: {
      "@context": coreContext(),
      "@id": `urn:semanticore:graph:${stableFragment(recordId)}:${index}`,
      "@type": "sc:TagTeamGraph",
      "sc:graphForRecord": { "@id": recordId },
      "sc:graphIndex": index,
      "sc:runtimeKind": { "@id": runtime.kind === "tagteam" ? "sc:TagTeamRuntime" : "sc:DeterministicFallbackRuntime" },
      "@graph": nodes,
    },
    warnings: contextCollisionWarnings(output, recordId),
  };
}

function buildFallbackGraph(recordId, index, text) {
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
      "@id": `urn:tagteam:act:${stableFragment(recordId)}:${index}`,
      "@type": ["tagteam:Act", "tagteam:DeonticSignal"],
      "schema:name": "deontic signal",
      "tagteam:deontic": true,
    });
  }
  return {
    "@context": coreContext(),
    "@id": `urn:semanticore:graph:${stableFragment(recordId)}:${index}`,
    "@type": "sc:TagTeamGraph",
    "sc:graphForRecord": { "@id": recordId },
    "sc:graphIndex": index,
    "@graph": nodes,
  };
}

function summarizeGraph(graph) {
  return {
    "@type": "sc:TagTeamSummary",
    "sc:entityCount": graph["@graph"].filter((node) => node["@type"] === "tagteam:Entity").length,
    "sc:actCount": graph["@graph"].filter((node) => Array.isArray(node["@type"]) && node["@type"].includes("tagteam:Act")).length,
    "sc:roleCount": 0,
    "sc:deonticDetected": graph["@graph"].some((node) => node["tagteam:deontic"] === true),
  };
}

function extractGraphNodes(tagTeamOutput) {
  if (Array.isArray(tagTeamOutput)) return tagTeamOutput.filter(isObject).map((node) => structuredClone(node));
  if (tagTeamOutput && Array.isArray(tagTeamOutput["@graph"])) {
    return tagTeamOutput["@graph"].filter(isObject).map((node) => structuredClone(node));
  }
  if (tagTeamOutput && isObject(tagTeamOutput)) return [structuredClone(tagTeamOutput)];
  throw new Error("TagTeam buildGraph returned an unsupported graph shape.");
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
    return {
      kind: "tagteam",
      version,
      warnings,
      diagnostics: runtimeDiagnostics("tagteam", version, ontologySupport, warnings),
      buildGraph(text, options) {
        return tagTeam.buildGraph(text, options);
      },
    };
  }

  const warnings = runtimeOntologyWarnings(false).filter((warning) => el.useOntologies.checked);
  return {
    kind: "fallback",
    version: fallbackRuntimeVersion,
    warnings,
    diagnostics: runtimeDiagnostics("fallback", fallbackRuntimeVersion, false, warnings),
    buildGraph(text) {
      return buildFallbackGraph("urn:semanticore:runtime:fallback", 0, text);
    },
  };
}

function buildTagTeamOptions() {
  const options = {
    ontologyThreshold: 0.2,
    verbose: false,
  };
  const tagTeam = window.TagTeam;
  if (!el.useOntologies.checked || !tagTeam?.OntologyTextTagger?.fromTTL) return options;
  const ttl = enabledOntologyContent().join("\n\n");
  if (!ttl.trim()) return options;
  options.ontology = tagTeam.OntologyTextTagger.fromTTL(ttl, {
    ontologyThreshold: options.ontologyThreshold,
    verbose: options.verbose,
  });
  return options;
}

function enabledOntologyContent() {
  const ontologySet = buildOntologySet();
  return ontologySet.ontologies
    .filter((ontology) => ontology["sc:enabled"] && typeof ontology["sc:content"] === "string")
    .map((ontology) => ontology["sc:content"]);
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
      renderMappingPreview();
      renderSourcePath();
    });
  });
  el.mappingRows.querySelectorAll("[data-remove-index]").forEach((button) => {
    button.addEventListener("click", () => {
      readMappingRows();
      state.mappingRows.splice(Number(button.dataset.removeIndex), 1);
      renderMapping();
    });
  });
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
  state.mappingRows = rows.length > 0 ? rows : [{ sourceColumn: "description", targetProperty: "schema:description" }];
}

function renderMappingPreview() {
  state.mappingManifest = buildMappingManifest();
  el.mappingPreview.textContent = stableStringify(state.mappingManifest, 2);
}

function renderStats() {
  const records = state.run?.records || state.dataset?.["sc:records"] || [];
  el.recordCount.textContent = String(records.length);
  el.enrichedCount.textContent = String((state.run?.records || []).filter((record) => {
    const enrichment = record["sc:semanticEnrichment"];
    return enrichment?.["sc:status"]?.["@id"] === "sc:EnrichmentSucceeded";
  }).length);
  el.warningCount.textContent = String(state.run?.warnings?.length || 0);
  el.graphCount.textContent = String(state.run?.graphs?.length || 0);
}

function renderSourcePath() {
  el.sourcePath.textContent = `sc:source / ${firstTextProperty()}`;
}

function renderResults() {
  const records = state.run?.records || state.dataset?.["sc:records"] || [];
  if (records.length === 0) {
    el.resultsBody.innerHTML = '<tr><td colspan="7">No records yet.</td></tr>';
    return;
  }
  el.resultsBody.innerHTML = records.map((record) => {
    const enrichment = record["sc:semanticEnrichment"];
    const summary = enrichment?.["sc:summary"];
    const recordWarnings = (state.run?.warnings || [])
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

function exportFor(kind) {
  if (kind === "dataset") return stableStringify(state.dataset || {}, 2);
  if (kind === "enriched" || kind === "jsonld") return stableStringify(state.run || {}, 2);
  if (kind === "graphs") {
    return stableStringify({
      "@context": coreContext(),
      "@id": "urn:semanticore:graph-bundle:browser-demo",
      "@type": "sc:GraphBundle",
      "sc:graphs": state.run?.graphs || [],
    }, 2);
  }
  if (kind === "warnings") return stableStringify(state.run?.warnings || [], 2);
  if (kind === "csv") return csvSummary();
  if (kind === "session") return stableStringify(buildSessionSnapshot(), 2);
  return "";
}

function csvSummary() {
  const header = "recordId,enrichmentStatus,sourceText,entityCount,actCount,roleCount,deonticDetected,namedGraphId,warningErrorCodes";
  const rows = (state.run?.records || []).map((record) => {
    const enrichment = record["sc:semanticEnrichment"] || {};
    const summary = enrichment["sc:summary"] || {};
    const warningCodes = (state.run?.warnings || [])
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
  if (!state.ontologySet) state.ontologySet = defaultOntologySet();
  const content = el.ontologyContent.value.trim();
  const title = el.ontologyName.value.trim() || "Untitled ontology";
  const id = `urn:semanticore:ontology:${stableFragment(title)}:${state.ontologySet.ontologies.length}`;
  state.ontologySet.ontologies.push({
    "@id": id,
    "@type": "sc:LocalOntology",
    "dcterms:title": title,
    "sc:enabled": true,
    "sc:mediaType": "text/turtle",
    "sc:contentHash": `sha256:${simpleHash(content)}`,
    "sc:content": content,
    "sc:ontologyAlignment": { "@id": el.ontologyAlignment.value },
  });
  renderOntology();
  renderSession();
}

function buildSessionSnapshot() {
  const snapshot = {
    "sc:format": state.format,
    "sc:sourceText": el.sourceInput.value,
    "sc:hasHeaderRow": el.hasHeaderRow.checked,
    "sc:jsonPointer": el.jsonPointer.value,
    "sc:mappingRows": state.mappingRows,
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
  const contentHash = `sha256:${simpleHash(stableStringify(snapshot))}`;
  return {
    "@context": coreContext(),
    "@id": "urn:semanticore:session:browser-demo",
    "@type": "sc:Session",
    "sc:contentHash": contentHash,
    "sc:dataset": hashReference(snapshot["sc:dataset"], "urn:semanticore:dataset:none"),
    "sc:configuration": {
      "@id": "urn:semanticore:config:browser-demo",
      "sc:contentHash": `sha256:${simpleHash(stableStringify(snapshot["sc:mappingManifest"]))}`,
    },
    "sc:contextManifest": hashReference(snapshot["sc:contextManifest"], "urn:semanticore:context-manifest:browser-demo"),
    "sc:ontologySet": hashReference(snapshot["sc:ontologySet"], "urn:semanticore:ontology-set:browser-demo"),
    "sc:snapshot": snapshot,
  };
}

function hashReference(document, fallbackId) {
  return {
    "@id": document?.["@id"] || fallbackId,
    "sc:contentHash": `sha256:${simpleHash(stableStringify(document || {}))}`,
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
  return {
    "@id": "urn:semanticore:ontology-set:browser-demo",
    "@type": "sc:OntologySet",
    ontologies: [
      {
        "@id": "urn:semanticore:ontology:browser-default",
        "@type": "sc:LocalOntology",
        "dcterms:title": "Browser default policy vocabulary",
        "sc:enabled": true,
        "sc:mediaType": "text/turtle",
        "sc:contentHash": "sha256:browser-default",
        "sc:content": "@prefix ex: <urn:example:> .\nex:Notice a ex:InformationContentEntity .",
        "sc:ontologyAlignment": { "@id": "sc:CCO2BFO2020Aligned" },
      },
    ],
  };
}

function buildContextManifest() {
  return {
    "@context": coreContext(),
    "@id": "urn:semanticore:context-manifest:browser-demo",
    "@type": "sc:ContextManifest",
    contexts: [
      {
        "@id": "urn:semanticore:context:browser-core",
        "@type": "sc:LocalContext",
        "sc:contentHash": "sha256:browser-core-context",
        "sc:contextDocument": {
          "@context": {
            sc: "https://semanticore.fandaws.org/ns/",
            schema: "https://schema.org/",
            tagteam: "https://tagteam.fandaws.org/ontology/",
            description: "schema:description",
            name: "schema:name",
            source: "sc:source",
          },
        },
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

function firstTextProperty() {
  return state.mappingRows.find((row) => row.targetProperty.includes("description"))?.targetProperty ||
    state.mappingRows[0]?.targetProperty ||
    "schema:description";
}

function firstSourceText(record) {
  const source = record["sc:source"] || {};
  return source[firstTextProperty()] || "";
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

function simpleHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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
