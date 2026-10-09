import PortfolioDesktop from "@/components/PortfolioDesktop";
import { connection } from "next/server";
import { getProjects } from "@/lib/projects";
import type { Project } from "@/data/projects";

// App Router에서 src/app/page.tsx는 '/' 주소의 첫 화면이다.
// 이 페이지는 서버 컴포넌트이고, 대화형 기능은 'use client'가 있는 PortfolioDesktop에 맡긴다.
export default async function Home() {
  // 빌드 때 DB 내용을 고정하지 않고 접속/새로고침할 때 최신 데이터를 조회한다.
  await connection();
  let projects: Project[] = [];
  let projectsUnavailable = false;
  try {
    projects = await getProjects();
  } catch (error) {
    projectsUnavailable = true;
    // DB 오류의 원문에는 접속 정보가 있을 수 있으므로 코드만 서버 로그에 남긴다.
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "DB_UNAVAILABLE";
    console.error("[projects] 조회 실패:", code);
  }
  return <PortfolioDesktop projects={projects} projectsUnavailable={projectsUnavailable} />;
}
