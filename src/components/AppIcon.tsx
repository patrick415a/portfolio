import Image from "next/image";

type AppIconProps = {
  name: "about" | "works" | "notes" | "contact";
};

export function AppIcon({ name }: AppIconProps) {
  // 바탕화면과 독이 같은 아이콘을 사용한다. name을 파일명에 넣어 네 아이콘 중 하나를 선택한다.
  // 원본 SVG → scripts/render-app-icons.mjs → 고해상도 PNG 순서로 만든 이미지다.
  // unoptimized는 Next.js의 이미지 변환을 건너뛰어 보정된 PNG를 그대로 제공한다.
  // 실제 표시 크기는 CSS에서 조절한다. alt는 부모 버튼이 이름을 알려주므로 비워 중복 읽기를 피한다.
  // draggable=false로 브라우저의 기본 이미지 드래그를 막고 직접 만든 아이콘 이동 기능을 사용한다.
  return (
    <Image
      className="app-icon"
      src={`/assets/icons/${name}-smooth.png`}
      width={44}
      height={44}
      alt=""
      draggable={false}
      unoptimized
    />
  );
}
