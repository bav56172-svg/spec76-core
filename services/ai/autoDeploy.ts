import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import {
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";

export interface AutoDeployPatch {
  file: string;
  code: string;
}

export interface AutoDeployResult {
  success: boolean;
  branch?: string;
  message: string;
}

function isPathWithinDirectory(directory: string, candidate: string): boolean {
  const relativePath = relative(directory, candidate);

  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  );
}

function resolvePatchPath(projectRoot: string, patchFile: string): string {
  if (!patchFile || patchFile.includes("\0") || isAbsolute(patchFile)) {
    throw new Error("Patch file must be a non-empty relative path");
  }

  const targetPath = resolve(projectRoot, patchFile);

  if (!isPathWithinDirectory(projectRoot, targetPath)) {
    throw new Error(`Patch file is outside the project directory: ${patchFile}`);
  }

  const realParentPath = realpathSync(dirname(targetPath));

  if (
    realParentPath !== projectRoot &&
    !isPathWithinDirectory(projectRoot, realParentPath)
  ) {
    throw new Error(`Patch parent directory is outside the project: ${patchFile}`);
  }

  if (existsSync(targetPath) && lstatSync(targetPath).isSymbolicLink()) {
    throw new Error(`Patch file must not be a symbolic link: ${patchFile}`);
  }

  return targetPath;
}

function runGit(args: string[], projectRoot: string): void {
  execFileSync("git", args, {
    cwd: projectRoot,
    stdio: "pipe",
  });
}

/**
 * Applies approved patches without passing patch paths or content through a shell.
 */
export async function runAutoDeploy(
  patches: AutoDeployPatch[],
): Promise<AutoDeployResult> {
  if (!Array.isArray(patches) || patches.length === 0) {
    return {
      success: false,
      message: "No patches to deploy",
    };
  }

  const projectRoot = realpathSync(process.cwd());

  try {
    const branchName = `ai/autodeploy-${Date.now()}`;
    const validatedPatches = patches.map((patch) => {
      if (
        !patch ||
        typeof patch.file !== "string" ||
        typeof patch.code !== "string"
      ) {
        throw new Error("Each patch must contain string file and code fields");
      }

      const targetPath = resolvePatchPath(projectRoot, patch.file);

      return {
        code: patch.code,
        relativePath: relative(projectRoot, targetPath),
        targetPath,
      };
    });

    runGit(["checkout", "-b", branchName], projectRoot);

    for (const patch of validatedPatches) {
      writeFileSync(patch.targetPath, patch.code, {
        encoding: "utf8",
        flag: "w",
      });
    }

    const patchedFiles = validatedPatches.map((patch) => patch.relativePath);

    runGit(["add", "--", ...patchedFiles], projectRoot);
    runGit(
      ["commit", "-m", "AI Auto Deploy: system improvements"],
      projectRoot,
    );
    runGit(["push", "origin", branchName], projectRoot);

    return {
      success: true,
      branch: branchName,
      message: "Deployed successfully via AI Auto Deploy",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Auto-deploy failed",
    };
  }
}
