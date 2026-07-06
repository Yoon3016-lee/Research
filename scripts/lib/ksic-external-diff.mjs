export function computeKsicExternalDiff(localRows, records) {
  const localByCode = new Map(localRows.map((r) => [r.code, r.name_ko]));
  const externalByCode = new Map(records.map((r) => [r.code, r.nameKo]));

  const onlyExternal = [];
  const onlyLocal = [];
  const nameMismatch = [];

  for (const [code, name] of externalByCode) {
    if (!localByCode.has(code)) onlyExternal.push(code);
    else {
      const localName = (localByCode.get(code) ?? "").trim();
      const extName = (name ?? "").trim();
      if (localName && extName && localName !== extName) {
        nameMismatch.push({ code, localName, externalName: extName });
      }
    }
  }
  for (const code of localByCode.keys()) {
    if (!externalByCode.has(code)) onlyLocal.push(code);
  }

  onlyExternal.sort();
  onlyLocal.sort();
  nameMismatch.sort((a, b) => a.code.localeCompare(b.code));

  return {
    externalTotal: records.length,
    localTotal: localRows.length,
    onlyExternalCount: onlyExternal.length,
    onlyLocalCount: onlyLocal.length,
    nameMismatchCount: nameMismatch.length,
    onlyExternalCodes: onlyExternal,
    onlyLocalCodes: onlyLocal,
    nameMismatches: nameMismatch,
    onlyExternalSample: onlyExternal.slice(0, 20),
    onlyLocalSample: onlyLocal.slice(0, 20),
    nameMismatchSample: nameMismatch.slice(0, 20),
  };
}

export function printDiffDetail(diff, { maxList = 30 } = {}) {
  const onlyExternal = diff.onlyExternalCodes ?? diff.onlyExternalSample ?? [];
  const onlyLocal = diff.onlyLocalCodes ?? diff.onlyLocalSample ?? [];
  const nameMismatch = diff.nameMismatches ?? diff.nameMismatchSample ?? [];

  if (onlyExternal.length > 0) {
    console.log("");
    console.log(
      `외부에만 있는 코드 (${diff.onlyExternalCount ?? onlyExternal.length}건, 최대 ${maxList}개 표시):`,
    );
    for (const code of onlyExternal.slice(0, maxList)) console.log(`  - ${code}`);
    if ((diff.onlyExternalCount ?? onlyExternal.length) > maxList) {
      console.log(`  … 외 ${(diff.onlyExternalCount ?? onlyExternal.length) - maxList}건`);
    }
  }

  if (onlyLocal.length > 0) {
    console.log("");
    console.log(
      `로컬에만 있는 코드 (${diff.onlyLocalCount ?? onlyLocal.length}건, 무역보험 미포함 가능):`,
    );
    for (const code of onlyLocal.slice(0, maxList)) console.log(`  - ${code}`);
    if ((diff.onlyLocalCount ?? onlyLocal.length) > maxList) {
      console.log(`  … 외 ${(diff.onlyLocalCount ?? onlyLocal.length) - maxList}건`);
    }
  }

  if (nameMismatch.length > 0) {
    console.log("");
    console.log(`명칭 불일치 (${diff.nameMismatchCount ?? nameMismatch.length}건):`);
    for (const row of nameMismatch.slice(0, maxList)) {
      console.log(`  - ${row.code}: 로컬="${row.localName}" / 외부="${row.externalName}"`);
    }
    if ((diff.nameMismatchCount ?? nameMismatch.length) > maxList) {
      console.log(`  … 외 ${(diff.nameMismatchCount ?? nameMismatch.length) - maxList}건`);
    }
  }
}

export function printSyncSummary(diffSummary) {
  console.log("");
  console.log("동기화 완료");
  console.log(`  외부 스냅샷: ${diffSummary.externalTotal}건`);
  console.log(`  로컬 KSIC:   ${diffSummary.localTotal}건`);
  console.log(`  외부에만 있음: ${diffSummary.onlyExternalCount}건`);
  console.log(`  로컬에만 있음: ${diffSummary.onlyLocalCount}건 (무역보험 목록 미포함 가능)`);
  console.log(`  명칭 불일치: ${diffSummary.nameMismatchCount}건`);

  printDiffDetail(diffSummary);

  console.log("");
  console.log("다시 보기: npm run db:check-ksic-sync");
  console.log("코드 1건: npm run db:check-ksic-sync -- 01500");
}
