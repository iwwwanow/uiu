import { describe, expect, test } from "bun:test";
import { parseVars, refChain, resolveVar } from "../src/css";

describe("parseVars", () => {
  test("reads declarations, skips comments", () => {
    const v = parseVars(`:root {
      /* --COMMENTED: #000; */
      --A: #fff; /* trailing */
      --B: oklch(0.5 0.1 200);
      --c-role: var(--A);
    }`);
    expect([...v.keys()]).toEqual(["--A", "--B", "--c-role"]);
    expect(v.get("--B")).toBe("oklch(0.5 0.1 200)");
  });

  test("duplicate declaration is an error", () => {
    expect(() => parseVars(":root { --A: #fff; --A: #000; }")).toThrow(/twice/);
  });
});

describe("resolveVar", () => {
  const v = parseVars(":root { --A: #fff; --b: var(--A); --c: var(--b); --x: var(--y); --y: var(--x); --u: var(--NOPE); }");

  test("follows var() chains", () => {
    expect(resolveVar(v, "--c")).toBe("#fff");
    expect(refChain(v, "--c")).toEqual(["--c", "--b", "--A"]);
  });
  test("cycle", () => expect(() => resolveVar(v, "--x")).toThrow(/cycle/));
  test("undefined reference names the chain", () =>
    expect(() => resolveVar(v, "--u")).toThrow(/--NOPE \(via --u\)/));
});
