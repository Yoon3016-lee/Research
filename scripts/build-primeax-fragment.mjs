import fs from "node:fs";

const src = fs.readFileSync(
  ".tmp/PRIMEAX_homepage_latest_source/public/preview/index.html",
  "utf8",
);
const main = src.match(/<main id="main">[\s\S]*?<\/main>/)?.[0];
const modal = src.match(/<aside class="axi-modal"[\s\S]*?<\/aside>/)?.[0] ?? "";
if (!main) throw new Error("main not found");

let frag = `${main}\n${modal}`;
frag = frag.replaceAll('src="assets/', 'src="/primeax-home/assets/');
frag = frag.replaceAll('src="upload/', 'src="/primeax-home/upload/');
frag = frag.replaceAll('href="#contact"', 'href="/inquiry"');

fs.writeFileSync("public/primeax-home/fragment.html", frag, "utf8");
console.log(
  "wrote fragment",
  frag.length,
  "hasHangul",
  /[가-힣]/.test(frag),
  "sample",
  frag.includes("리서치 전 과정을"),
);
