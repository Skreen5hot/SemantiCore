import type { EnrichmentConfiguration, WarningResource } from "./types.js";
import { iri, VersionPolicy, WarningCode } from "./vocabulary.js";
import { makeWarning } from "./warnings.js";

interface Semver {
  major: number;
  minor: number;
  patch: number;
}

export interface VersionDecision {
  canRun: boolean;
  warnings: WarningResource[];
}

export function evaluateTagTeamVersion(
  configuration: EnrichmentConfiguration,
  runtimeVersion: string,
  recordId: string,
): VersionDecision {
  const required = configuration["sc:requiredTagTeamVersion"];
  const policy = configuration["sc:tagTeamVersionPolicy"]?.["@id"] ?? VersionPolicy.RejectOnMismatch;

  if (!required || !isSemver(required) || !isSemver(runtimeVersion)) {
    return mismatch(false, recordId, required, runtimeVersion, policy);
  }

  const exactMatch = required === runtimeVersion;
  if (exactMatch) {
    return { canRun: true, warnings: [] };
  }

  if (policy === VersionPolicy.WarnAndRunOnMismatch) {
    return mismatch(true, recordId, required, runtimeVersion, policy);
  }

  if (policy === VersionPolicy.AllowCompatibleMinor) {
    const requiredVersion = parseSemver(required);
    const runtime = parseSemver(runtimeVersion);
    if (
      requiredVersion &&
      runtime &&
      requiredVersion.major === runtime.major &&
      runtime.minor >= requiredVersion.minor
    ) {
      return mismatch(true, recordId, required, runtimeVersion, policy);
    }
  }

  return mismatch(false, recordId, required, runtimeVersion, policy);
}

function mismatch(
  canRun: boolean,
  recordId: string,
  required: string,
  actual: string,
  policy: string,
): VersionDecision {
  return {
    canRun,
    warnings: [
      makeWarning({
        code: WarningCode.TagTeamVersionMismatch,
        message: `TagTeam runtime version ${actual} does not satisfy required version ${required} under ${policy}.`,
        recordId,
        recoverable: canRun,
        extra: {
          "sc:requiredTagTeamVersion": required,
          "sc:actualTagTeamVersion": actual,
          "sc:tagTeamVersionPolicy": iri(policy),
        },
      }),
    ],
  };
}

function isSemver(value: string): boolean {
  return parseSemver(value) !== null;
}

function parseSemver(value: string): Semver | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}
