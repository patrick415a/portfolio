// 프로젝트를 추가할 때는 이 배열에 항목을 넣으면 Works 카드와 상세 창에 함께 반영됩니다.
export type Project = {
  // id는 카드의 고유 식별자다. 다른 프로젝트와 중복되지 않게 정한다.
  id: string;
  title: string;
  subtitle: string;
  // public: 상세 실행 가능 / preparing: 제작 중 / reserved: 다음 작업을 위한 빈 자리.
  status: "public" | "preparing" | "reserved";
  // ?는 생략 가능한 속성이다. image는 public 폴더 기준 경로이며 /assets/... 형태로 적는다.
  image?: string;
  detailTitle?: string;
  detailEyebrow?: string;
  // 설명 배열의 항목 하나가 문단 하나, technologies의 항목 하나가 기술 태그 하나가 된다.
  description?: string[];
  technologies?: string[];
  // 실제 https:// 주소를 넣으면 상세 화면의 링크 카드가 활성화된다.
  githubUrl?: string;
  siteUrl?: string;
  // 현재 포트폴리오는 웹사이트 링크 대신 현재 페이지라는 안내를 표시한다.
  isCurrentSite?: boolean;
};

// 화면에 표시되는 순서대로 작성한다. 현재 첫 항목을 초기 상세 데이터로 사용하므로 배열은 비워두지 않는다.
// 새 작업을 추가할 때 아래 항목을 참고해 고유 id와 내용을 작성하고 status를 public으로 지정한다.
export const projects: Project[] = [
  {
    id: "portfolio",
    title: "portfolio.site",
    subtitle: "WEB / 2026",
    status: "public",
    isCurrentSite: true,
    detailTitle: "포트폴리오",
    detailEyebrow: "01 · PERSONAL PORTFOLIO",
    description: [
      "지금 보고 있는 포트폴리오입니다. 바탕화면과 파일 창의 형태로 소개와 작업물을 담았습니다.",
      "창 이동과 크기 조절, 테마 변경, 브라우저에 저장되는 메모장으로 작은 작업실을 만들었습니다.",
    ],
    technologies: ["Next.js", "React", "TypeScript", "CSS"],
  },
  {
    id: "guddaji",
    title: "구따지.app",
    subtitle: "WEB / 2026",
    status: "public",
    image: "/assets/guddaji-screenshot.jpg",
    detailTitle: "구따지",
    detailEyebrow: "02 · INTERACTIVE 3D WEB",
    description: [
      "구름 캐릭터가 사는 작은 세계를 직접 걷고 살펴보는 웹 프로젝트.",
      "AI 이미지와 Meshy 에셋을 React, Three.js로 구현했습니다.",
    ],
    technologies: ["React", "Three.js", "AI Assets"],
  },
  {
    id: "project-03",
    title: "project_03",
    subtitle: "다음 파일 자리",
    status: "reserved",
  },
  {
    id: "project-04",
    title: "project_04",
    subtitle: "다음 파일 자리",
    status: "reserved",
  },
];
