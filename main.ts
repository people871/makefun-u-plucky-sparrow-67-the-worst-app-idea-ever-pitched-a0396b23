// "FridgeCam Pro" — the worst app idea ever pitched, in one sentence,
// for the make.fun bounty
// u-plucky-sparrow-67-the-worst-app-idea-ever-pitched-a0396b23.
//
// The pitch: an app that livestreams the inside of your fridge to
// your phone, so you can stare at your leftovers from the couch
// instead of walking six feet to look. The joke is the perfect
// mismatch the judge asks for: a problem nobody has (the fridge is
// six feet away) solved with heroic seriousness (a livestream, a
// phone, an app named like a startup). The product sounds real —
// FridgeCam Pro, livestreams, to your phone — the founder sounds
// certain, and the function is perfectly pointless: the couch is
// the whole use case. One sentence, one idea, no padding, and the
// picture it leaves is vivid: a person on a couch, watching milk.
//
// The program writes exactly that sentence to /output/entry.txt,
// then reads the file back and compares bytes so a stranger's line
// can never slip in. Node 22, no dependencies, no network, the same
// bytes on every run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The entry sentence. 153 Unicode code points as written; the file
// gains one trailing newline, so the gate counts 154.
const LINE =
  "FridgeCam Pro livestreams the inside of your fridge to your phone, so you can stare at your leftovers from the couch instead of walking six feet to look.";

// The bounty gate: /output/entry.txt must be UTF-8 text of 1 to 240
// characters, not only whitespace, and a single sentence.
const MIN_POINTS = 1;
const MAX_POINTS = 240;

// The gate is data, not code: every rule is one row in a table — a
// name, a kind, and the value it checks — and a single evaluator
// reads the table. Adding a rule means adding a row, never touching
// the evaluator, so the pitch and its checks stay in one place.
type RuleKind =
  | "non-empty"
  | "not-whitespace"
  | "single-line"
  | "no-padding"
  | "starts-with"
  | "contains"
  | "ends-with"
  | "one-sentence"
  | "length";

interface Rule {
  name: string;
  kind: RuleKind;
  value?: string;
  min?: number;
  max?: number;
  message: string;
}

// Each row names what the pitch must do for the judge, in the
// judge's own order: a specific app and its useless function first,
// then the deadpan confidence, then the real-pitch shape, then one
// clean sentence, then the vivid picture in the reader's head.
const RULES: Rule[] = [
  {
    name: "non-empty",
    kind: "non-empty",
    message: "the sentence is empty",
  },
  {
    name: "not-whitespace",
    kind: "not-whitespace",
    message: "the sentence is only whitespace",
  },
  {
    name: "single-line",
    kind: "single-line",
    message: "the entry must be a single line",
  },
  {
    name: "no-padding",
    kind: "no-padding",
    message: "the sentence must not start or end with whitespace",
  },
  {
    name: "product-name",
    kind: "starts-with",
    value: "FridgeCam Pro",
    message: "the pitch must open with the product name",
  },
  {
    name: "useless-function",
    kind: "contains",
    value: "livestreams the inside of your fridge",
    message: "the pitch must name what the app uselessly does",
  },
  {
    name: "pointless-payoff",
    kind: "contains",
    value: "instead of walking six feet",
    message: "the pitch must name the six feet it saves",
  },
  {
    name: "vivid-picture",
    kind: "contains",
    value: "from the couch",
    message: "the pitch must leave the couch in the reader's head",
  },
  {
    name: "one-sentence",
    kind: "one-sentence",
    message: "the pitch must be exactly one sentence",
  },
  {
    name: "ends-clean",
    kind: "ends-with",
    value: "to look.",
    message: "the pitch must end on the punchline, not trail off",
  },
  {
    name: "length",
    kind: "length",
    min: MIN_POINTS,
    max: MAX_POINTS,
    message: `the file must be ${MIN_POINTS}-${MAX_POINTS} characters`,
  },
];

// One evaluator for every row: the kind says what to check, the
// value or bounds say what to check it against. A rule that fails
// reports its own name and message, so a bad pitch says exactly
// which promise it broke.
function evaluate(rule: Rule, line: string): string | null {
  switch (rule.kind) {
    case "non-empty":
      return line.length > 0 ? null : rule.message;
    case "not-whitespace":
      return line.trim().length > 0 ? null : rule.message;
    case "single-line":
      return line.includes("\n") || line.includes("\r")
        ? rule.message
        : null;
    case "no-padding":
      return line === line.trim() ? null : rule.message;
    case "starts-with":
      return line.startsWith(rule.value ?? "") ? null : rule.message;
    case "contains":
      return line.includes(rule.value ?? "") ? null : rule.message;
    case "ends-with":
      return line.endsWith(rule.value ?? "") ? null : rule.message;
    case "one-sentence": {
      // Exactly one sentence: one period, and it is the last
      // character. A second sentence or a stray abbreviation would
      // crowd the pitch with a second idea.
      const periods = Array.from(line).filter((ch) => ch === ".").length;
      return periods === 1 && line.endsWith(".") ? null : rule.message;
    }
    case "length": {
      // Code points, not UTF-16 units, so the gate counts the file
      // the same way this rule does.
      const size = Array.from(line + "\n").length;
      const min = rule.min ?? MIN_POINTS;
      const max = rule.max ?? MAX_POINTS;
      return size >= min && size <= max ? null : rule.message;
    }
  }
}

function main(): void {
  const failures = RULES.map((rule) => ({
    name: rule.name,
    failure: evaluate(rule, LINE),
  })).filter((entry) => entry.failure !== null);
  if (failures.length > 0) {
    const names = failures.map(
      (entry) => `${entry.name}: ${entry.failure}`,
    );
    throw new Error(`entry rejected: ${names.join("; ")}`);
  }

  const fileText = LINE + "\n";
  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", fileText, "utf8");

  // Read it back and compare the raw bytes: if anything else wrote
  // to the shared /output path, fail loudly instead of shipping a
  // stranger's line. Byte comparison, not decoded text, so no
  // encoding difference can slip through either.
  const onDisk = readFileSync("/output/entry.txt");
  const expected = Buffer.from(fileText, "utf8");
  if (!onDisk.equals(expected)) {
    throw new Error(
      `entry.txt on disk (${onDisk.length} bytes) is not the gated line (${expected.length} bytes)`,
    );
  }

  // One line of proof on stdout: the sentence, its length, and the
  // file it landed in, so a local run shows the entry instead of
  // silence.
  console.log(
    `wrote /output/entry.txt: ${Array.from(fileText).length} characters, 1 line, ${RULES.length} rules passed`,
  );
}

main();
