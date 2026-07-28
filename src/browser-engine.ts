import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox } from "playwright-core";
import { runChecked } from "./process";

export type BrowserEngine = "chromium" | "firefox";

export function browserName(engine: BrowserEngine): string {
  return engine === "firefox" ? "Firefox" : "Chromium";
}

export function browserType(engine: BrowserEngine): typeof chromium | typeof firefox {
  return engine === "firefox" ? firefox : chromium;
}

export function defaultChromiumExecutable(
  platform: NodeJS.Platform = process.platform,
  exists: (path: string) => boolean = existsSync,
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (platform === "darwin") return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (platform === "win32") {
    return join(env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe");
  }
  const linuxCandidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ];
  return linuxCandidates.find(candidate => exists(candidate)) ?? "/usr/bin/google-chrome";
}

export function defaultBrowserExecutable(engine: BrowserEngine): string | undefined {
  if (engine === "firefox") return undefined;
  return defaultChromiumExecutable();
}

export function resolvedBrowserExecutable(config: {
  browserEngine: BrowserEngine;
  browserExecutablePath?: string;
}): string {
  return config.browserExecutablePath || browserType(config.browserEngine).executablePath();
}

export function ensureBrowserExecutable(config: {
  browserEngine: BrowserEngine;
  browserExecutablePath?: string;
}): string {
  let executable = resolvedBrowserExecutable(config);
  if (existsSync(executable)) return executable;
  if (config.browserEngine !== "firefox" || config.browserExecutablePath) {
    throw new Error(`${browserName(config.browserEngine)} was not found at ${executable}. Pass --browser-path with its executable path.`);
  }

  const packageEntry = fileURLToPath(import.meta.resolve("playwright-core"));
  const cli = join(dirname(packageEntry), "cli.js");
  runChecked(process.execPath, [cli, "install", "firefox"], { stdio: "inherit" });
  executable = resolvedBrowserExecutable(config);
  if (!existsSync(executable)) throw new Error(`Playwright did not install Firefox at ${executable}`);
  return executable;
}
