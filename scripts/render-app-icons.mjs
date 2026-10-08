import sharp from "sharp";
import { fileURLToPath } from "node:url";

// 아이콘 SVG를 수정한 뒤 프로젝트 폴더에서 node scripts/render-app-icons.mjs로 직접 실행한다.
// dev/build에 자동으로 연결된 작업은 아니다. AppIcon은 아래에서 생성하는 PNG를 사용한다.
// 고해상도에서 경계를 보정한 뒤 축소한다. 모바일 52px에서도 4배 해상도이다.
for (const name of ["about", "works", "notes", "contact"]) {
  // import.meta.url 기준으로 경로를 계산하므로 실행 위치와 무관하게 같은 파일을 찾는다.
  const source = fileURLToPath(new URL(`../public/assets/icons/${name}.svg`, import.meta.url));
  const output = fileURLToPath(new URL(`../public/assets/icons/${name}-smooth.png`, import.meta.url));
  // 높은 density로 SVG를 먼저 크게 렌더링하고, Lanczos 필터로 208px까지 축소해 경계를 다듬는다.
  // PNG로 저장해 투명 배경을 유지한다. 208px은 모바일 표시 크기 52px의 4배다.
  await sharp(source, { density: 1152 })
    .resize(208, 208, { kernel: "lanczos3" })
    .png()
    .toFile(output);
}
