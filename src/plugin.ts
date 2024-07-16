import { promisify } from "node:util";
import { exec } from "node:child_process";
import type { Plugin } from "vite";

const asyncExec = promisify(exec);

export function rollupPluginYalc(): Plugin {
  return {
    name: "rollup-plugin-yalc",
    async closeBundle() {
      if (!(await commandExists("yalc"))) return;
      const { stdout } = await asyncExec("npx yalc push");
      const [publishedLog, ...logs] = stdout.split("\n");
      const packages = getPushingPackages(logs);
      const isPushedLog = packages.length ? " is pushed to:" : "";
      this.info(`version ${getPackageVersion(publishedLog)}${isPushedLog}`);
      packages.forEach((l, index) => this.info(`${index + 1}. ${l}`));
    },
  };
}

async function commandExists(command: string) {
  try {
    await asyncExec(`command -v ${command}`);
    return true;
  } catch {
    return false;
  }
}

function getPackageVersion(stdout: string) {
  const [packageInfo] = stdout.split(" ");
  const packageVersion = packageInfo.split("@").pop();
  return packageVersion;
}

function getPushingPackages(stdout: string[]) {
  return stdout
    .filter((log) => log.startsWith("Pushing"))
    .map((log) => {
      const directory = log.split(" ").pop();
      const lastDirectory = directory!.split("/").pop();
      return `${directory}/${lastDirectory}`;
    });
}
