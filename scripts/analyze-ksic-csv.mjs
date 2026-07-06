import fs from "fs";

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

function analyze(path, label, codeKey) {
  let text = fs.readFileSync(path, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = parseCSV(text);
  const header = rows[0];
  const data = rows.slice(1);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  console.log(`\n=== ${label} ===`);
  console.log("file size MB:", (fs.statSync(path).size / 1024 / 1024).toFixed(2));
  console.log("column count:", header.length);
  console.log("columns:", header.join(", "));
  console.log("parsed rows:", data.length);

  const codes = data.map((r) => r[idx[codeKey]]?.trim()).filter(Boolean);
  console.log("unique", codeKey + ":", new Set(codes).size);

  if (idx.level_name) {
    const levels = {};
    for (const r of data) {
      const l = r[idx.level_name];
      levels[l] = (levels[l] || 0) + 1;
    }
    console.log("level_name:", levels);
  }

  const parentMissing = data.filter((r) => {
    const ln = r[idx.level_name];
    return ln && ln !== "대분류" && !r[idx.parent_code]?.trim();
  });
  console.log("missing parent_code (non-major):", parentMissing.length);

  const coffee = data.filter((r) =>
    (r[idx.name_ko] || r[idx.detail_name_ko] || "").includes("커피"),
  );
  console.log(
    "coffee-related:",
    coffee.map((r) => [r[idx[codeKey]], r[idx.name_ko || idx.detail_name_ko]]),
  );

  const d56221 = data.find((r) => r[idx[codeKey]] === "56221");
  if (d56221) {
    console.log("56221 name:", d56221[idx.name_ko || idx.detail_name_ko]);
    console.log("56221 path:", (d56221[idx.path_ko] || "").slice(0, 150));
    const aiKey = idx.ai_context_for_survey ?? idx.ai_context;
    if (aiKey != null) {
      console.log("56221 ai_context chars:", d56221[aiKey]?.length ?? 0);
    }
  }

  const dup = {};
  for (const c of codes) dup[c] = (dup[c] || 0) + 1;
  const dupCodes = Object.entries(dup).filter(([, n]) => n > 1);
  console.log("duplicate codes:", dupCodes.length);
  if (dupCodes.length) console.log("dup examples:", dupCodes.slice(0, 5));
}

analyze(
  "c:/Users/sy968/Downloads/ksic11_ai_code_reference(1).csv",
  "code_reference",
  "code",
);
analyze(
  "c:/Users/sy968/Downloads/ksic11_ai_detail_reference(1).csv",
  "detail_reference",
  "detail_code",
);
