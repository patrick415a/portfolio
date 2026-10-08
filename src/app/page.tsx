import PortfolioDesktop from "@/components/PortfolioDesktop";

// App Router에서 src/app/page.tsx는 '/' 주소의 첫 화면이다.
// 이 페이지는 서버 컴포넌트이고, 대화형 기능은 'use client'가 있는 PortfolioDesktop에 맡긴다.
export default function Home() {
  return <PortfolioDesktop />;
}
