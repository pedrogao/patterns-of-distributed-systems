import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const workDir = process.cwd();
const readmeFile = join(workDir, "README.md");
const README = readFileSync(readmeFile, "utf-8");

const patternNav = join(workDir, "pattern-nav.json");
const items = [];

README.split("\n").forEach((line) => {
  if (line.startsWith("*")) {
    const leftSplit = line.indexOf("[");
    const rightSplit = line.lastIndexOf("(");

    const text = line.substring(leftSplit + 1, rightSplit - 1);
    const link =
      "/" + line.substring(rightSplit + 1, line.length - 1).replace(".md", "");
    items.push({
      text,
      link,
    });
  }
});

const json = JSON.stringify(items, null, 2);
writeFileSync(patternNav, json);
