import fs from "fs";
import path from "path";

const CODE = process.argv[2] ?? "10601";
const BASE = path.resolve("data/ksic");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQ = false;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (c === '"') {
        inQ = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQ = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadCsv(filename) {
  let text = fs.readFileSync(path.join(BASE, filename), "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = parseCSV(text);
  const header = rows[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return { header, rows: rows.slice(1), idx };
}

const files = fs.readdirSync(BASE).filter((f) => f.endsWith(".csv"));
const codeFile = files.find((f) => f.includes("code_reference")) ?? files[0];
const detailFile = files.find((f) => f.includes("detail_reference")) ?? files[1];

for (const [label, file, key] of [
  ["계층 마스터 (code_reference)", codeFile, "code"],
  ["AI 설문용 (detail_reference)", detailFile, "detail_code"],
]) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${label}: ${file}`);
  console.log("=".repeat(60));

  const { header, rows, idx } = loadCsv(file);
  const hit = rows.find((r) => r[idx[key]]?.trim() === CODE);

  if (!hit) {
    console.log(`코드 ${CODE} 없음`);
    continue;
  }

  for (const col of header) {
    const val = hit[idx[col]]?.trim();
    if (!val) continue;
    console.log(`\n[${col}]`);
    console.log(val);
  }
}
