import { expect, test } from "bun:test";
import { join } from "node:path";
import { defaultBrowserExecutable, defaultChromiumExecutable } from "../src/browser-engine";

function fakeExists(paths: string[]): (path: string) => boolean {
  const existing = new Set(paths);
  return path => existing.has(path);
}

test("Linux Chromium discovery selects /usr/bin/chromium when it is available", () => {
  expect(defaultChromiumExecutable("linux", fakeExists(["/usr/bin/chromium"]))).toBe("/usr/bin/chromium");
});

test("Linux Chromium discovery respects candidate order", () => {
  expect(defaultChromiumExecutable("linux", fakeExists([
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/snap/bin/chromium",
  ]))).toBe("/usr/bin/google-chrome-stable");
});

test("Linux Chromium discovery falls back to /usr/bin/google-chrome when no candidate exists", () => {
  expect(defaultChromiumExecutable("linux", fakeExists([]))).toBe("/usr/bin/google-chrome");
});

test("Firefox default remains Playwright-managed", () => {
  expect(defaultBrowserExecutable("firefox")).toBeUndefined();
});

test("macOS and Windows Chromium defaults remain unchanged", () => {
  expect(defaultChromiumExecutable("darwin", fakeExists([]))).toBe("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  expect(defaultChromiumExecutable("win32", fakeExists([]), {})).toBe(
    join("C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  );
});
