// DB 접속 코드는 서버에만 두고, 이 파일은 화면에 전달할 데이터의 형태만 정의한다.
export type ProjectImage = {
  id: string;
  src: string;
  alt: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  status: "public" | "preparing";
  summary?: string;
  image?: string;
  imageAlt?: string;
  images: ProjectImage[];
  detailTitle: string;
  category?: string;
  description: string[];
  technologies: string[];
  githubUrl?: string;
  siteUrl?: string;
  isCurrentSite: boolean;
};
