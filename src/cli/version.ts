import { readFileSync } from "fs";

// The CLI runs from dist/cli/, two levels below the package
const packageJson = new URL("../../package.json", import.meta.url);

export const version: string = JSON.parse(readFileSync(packageJson, "utf8")).version;
