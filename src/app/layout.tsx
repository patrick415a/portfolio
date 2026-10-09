import type { Metadata } from "next";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/data/themes";
// 최상위 레이아웃에서 공통 CSS를 한 번 불러와 모든 페이지에 적용한다.
import "./globals.css";

// 브라우저 탭 제목과 페이지 설명이다. 화면에 보이는 큰 제목과는 별도로 설정한다.
export const metadata: Metadata = {
  title: "Sungho — 내 생각을 움직이는 작업실",
  description: "아이디어를 움직이는 웹 작업실. Sungho의 프로젝트와 기록을 만나보세요.",
};

// children에는 해당 주소의 페이지가 들어온다. lang은 문서의 기본 언어를 알려준다.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        {/* 저장된 테마를 첫 화면부터 적용한다. html의 data-theme만 hydration 전에 바뀐다. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
