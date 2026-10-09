import "server-only";
import type { Project, ProjectImage } from "@/data/projects";
import { getDatabasePool } from "./db";

type ProjectRow = {
  id: number;
  slug: string;
  title: string;
  file_name: string;
  summary: string | null;
  description: string | null;
  category: string | null;
  year: number | null;
  github_url: string | null;
  site_url: string | null;
  status: "public" | "preparing";
};
type ImageRow = { id: number; project_id: number; file_name: string; alt_text: string; is_thumbnail: number };
type TechnologyRow = { project_id: number; name: string };

function imagePath(fileName: string): string | undefined {
  // DB에는 파일명만 입력한다. 폴더 이동이나 외부 URL은 허용하지 않는다.
  if (!fileName || /[/\\\x00-\x1f]/.test(fileName) || fileName.includes("..")) return undefined;
  return `/assets/projects/${encodeURIComponent(fileName)}`;
}

function websiteUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch { return undefined; }
}

export async function getProjects(): Promise<Project[]> {
  const pool = getDatabasePool();
  // 프로젝트마다 조회하는 대신 세 번의 조회로 목록·이미지·기술을 가져온다.
  // 숨긴 프로젝트는 서버에서 제외하여 브라우저에도 전달하지 않는다.
  const [rows, imageRows, technologyRows] = await Promise.all([
    pool.query<ProjectRow[]>({ timeout: 5000, sql: `
      SELECT id, slug, title, file_name, summary, description, category, year,
             github_url, site_url, status
      FROM projects WHERE is_visible = 1 ORDER BY sort_order, id
    ` }),
    pool.query<ImageRow[]>({ timeout: 5000, sql: `
      SELECT i.id, i.project_id, i.file_name, i.alt_text, i.is_thumbnail
      FROM project_images i JOIN projects p ON p.id = i.project_id
      WHERE p.is_visible = 1 ORDER BY i.project_id, i.sort_order, i.id
    ` }),
    pool.query<TechnologyRow[]>({ timeout: 5000, sql: `
      SELECT t.project_id, t.name
      FROM project_technologies t JOIN projects p ON p.id = t.project_id
      WHERE p.is_visible = 1 ORDER BY t.project_id, t.sort_order, t.id
    ` }),
  ]);

  const imagesByProject = new Map<number, (ProjectImage & { thumbnail: boolean })[]>();
  for (const row of imageRows) {
    const src = imagePath(row.file_name);
    if (!src) continue;
    const images = imagesByProject.get(row.project_id) ?? [];
    images.push({ id: String(row.id), src, alt: row.alt_text, thumbnail: Boolean(row.is_thumbnail) });
    imagesByProject.set(row.project_id, images);
  }
  const technologiesByProject = new Map<number, string[]>();
  for (const row of technologyRows) {
    const technologies = technologiesByProject.get(row.project_id) ?? [];
    technologies.push(row.name);
    technologiesByProject.set(row.project_id, technologies);
  }

  // 화면에 필요한 값만 일반 객체로 변환한다. DB 행/연결 객체는 그대로 전달하지 않는다.
  return rows.map((row) => {
    const images = imagesByProject.get(row.id) ?? [];
    const thumbnail = images.find((image) => image.thumbnail) ?? images[0];
    return {
      id: String(row.id),
      slug: row.slug,
      title: row.file_name,
      detailTitle: row.title,
      subtitle: [row.category, row.year].filter((value) => value !== null && value !== "").join(" / "),
      category: row.category ?? undefined,
      summary: row.summary ?? undefined,
      status: row.status,
      image: thumbnail?.src,
      imageAlt: thumbnail?.alt,
      images: images.map(({ id, src, alt }) => ({ id, src, alt })),
      description: (row.description ?? "").split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean),
      technologies: technologiesByProject.get(row.id) ?? [],
      githubUrl: websiteUrl(row.github_url),
      siteUrl: websiteUrl(row.site_url),
      isCurrentSite: row.slug === "portfolio",
    };
  });
}
