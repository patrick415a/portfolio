"use client";

import Image from "next/image";
import { useState } from "react";
import type { Project } from "@/data/projects";
import { profile } from "@/data/profile";
import { PortfolioPreview } from "./PortfolioPreview";

// 앱 안의 내용만 담당하는 컴포넌트들이다. 창 이동·최소화 등의 상태는 PortfolioDesktop이 관리한다.
// props는 부모가 전달한 값이다. Works는 실행 함수, 상세 창은 선택된 프로젝트를 전달받는다.

type WorksContentProps = {
  projects: Project[];
  unavailable?: boolean;
  onOpenProject: (project: Project) => void;
};

// 소개 문구와 사용 기술을 수정하려면 이 컴포넌트를 편집한다.
// 원형 캐릭터와 기본 정보는 profile.ts에서 읽는다.
export function AboutContent() {
  return (
    <div className="about-content">
      <p className="eyebrow">FILE / ABOUT ME</p>
      <div className="about-heading">
        <h2>
          안녕하세요,
          <br />
          <span>성호입니다!</span>
        </h2>
        <div className="about-emblem">
          <Image src={profile.avatarSrc} alt="이성호의 캐릭터 프로필" width={212} height={212} sizes="(max-width: 700px) 84px, 112px" />
        </div>
      </div>
      <dl className="about-info">
        <div><dt>이름</dt><dd>{profile.name}</dd></div>
        <div><dt>생년월일</dt><dd><time dateTime={profile.birthDate}>{profile.birthDateLabel}</time></dd></div>
      </dl>
      <p className="about-description">
        머릿속 아이디어를 눈에 보이는 화면으로 만드는 걸 좋아합니다.
        <br className="desktop-break" /> 디자인부터 웹 구현까지, 하나씩 배우며 만들어갑니다.
      </p>
      <div className="skill-tags" aria-label="사용 기술과 작업 방식">
        <span>CREATIVE WEB</span>
        <span>React</span>
        <span>JavaScript</span>
        <span>HTML</span>
        <span>CSS</span>
        <span>Photoshop</span>
        <span>Illustrator</span>
        <span>AI PROCESS</span>
      </div>
    </div>
  );
}

function ProjectCover({ project }: { project: Project }) {
  // 스크린샷이 있으면 표시하고, 없으면 프로젝트 상태에 맞는 자리 표시용 표지를 만든다.
  // fill은 부모 영역을 채운다. CSS의 relative/비율과 sizes가 이미지 배치·로드 크기를 정한다.
  if (project.image) {
    return (
      <div className="project-cover has-image">
        <Image src={project.image} alt={project.imageAlt || `${project.detailTitle} 프로젝트 화면`} fill sizes="(max-width: 700px) 45vw, 30vw" />
      </div>
    );
  }
  if (project.isCurrentSite) {
    return <div className="project-cover" aria-hidden="true"><PortfolioPreview /></div>;
  }

  return (
    <div className="project-cover preparing" aria-hidden="true">
      <span>✳</span>
    </div>
  );
}

export function WorksContent({ projects, unavailable = false, onOpenProject }: WorksContentProps) {
  // 카드와 공개 개수를 같은 데이터에서 계산하므로 프로젝트 추가 시 수동으로 개수를 고칠 필요가 없다.
  // 5개 이상은 is-expanded 클래스로 PC 3열 배치가 된다. 모바일은 CSS에서 항상 2열로 표시한다.
  const publicCount = projects.filter((project) => project.status === "public").length;

  return (
    <div className="works-content">
      <p className="eyebrow">SUNGHO / WORKS</p>
      <div className="works-heading">
        <h2>My projects.</h2>
        {!unavailable && <p>{publicCount} OPEN{projects.length > publicCount && <> <span>·</span> {projects.length - publicCount} IN PROGRESS</>}</p>}
      </div>
      {unavailable ? (
        <div className="projects-message" role="status">
          <p>프로젝트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
          <button type="button" onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      ) : projects.length === 0 ? (
        <p className="projects-message">공개된 프로젝트가 아직 없어요.</p>
      ) : null}
      <div className={`projects-grid ${projects.length > 4 ? "is-expanded" : ""}`}>
        {projects.map((project) => {
          // map은 데이터 한 항목을 카드 하나로 만든다. 고유 id를 key로 써 React가 카드를 구분한다.
          // DB의 공개 항목만 표시한다. 제작 중인 항목은 보이지만 상세 실행은 비활성화한다.
          const available = project.status === "public";
          return (
            <button
              className="project-card"
              type="button"
              key={project.id}
              disabled={!available}
              onClick={() => onOpenProject(project)}
              title={project.summary}
              aria-label={available ? `${project.title} 상세 열기` : `${project.title}, ${project.subtitle}`}
            >
              <ProjectCover project={project} />
              <span className="project-title">{project.title}{available && <span aria-hidden="true"> ↗</span>}</span>
              <span className="project-status"><i className={`status-dot ${project.status}`} />{!available ? "제작 중" : project.isCurrentSite ? "현재 페이지" : "공개 중"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectDetailContent({ project, projectNumber, onBack }: { project: Project; projectNumber: number; onBack: () => void }) {
  const number = String(projectNumber).padStart(2, "0");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  // 대표 이미지로 시작하고, 아래 작은 이미지를 누르면 상세 스크린샷만 바뀐다.
  const image = project.images.find(({ id }) => id === selectedImageId)
    ?? project.images.find(({ src }) => src === project.image) ?? project.images[0];

  return (
    <div className="detail-content">
      <p className="eyebrow">PROJECT / {number}{project.category && ` · ${project.category.toUpperCase()}`}</p>
      <div className="detail-heading">
        <h2>{project.detailTitle ?? project.title}</h2>
        <button className="project-back" type="button" onClick={onBack} aria-label="상세 닫고 Works로 돌아가기">← works</button>
      </div>
      <div className="detail-layout">
        <div className="detail-preview">
          {image ? <Image src={image.src} alt={image.alt || `${project.detailTitle} 프로젝트 화면`} width={1050} height={591} sizes="(max-width: 700px) 90vw, 50vw" /> : project.isCurrentSite ? <PortfolioPreview /> : <p>등록된 스크린샷이 없어요.</p>}
          {project.images.length > 1 && (
            <div className="screenshot-thumbnails" role="group" aria-label="프로젝트 스크린샷 선택">
              {project.images.map((screenshot, index) => (
                <button key={screenshot.id} type="button" aria-label={`${index + 1}번 스크린샷 보기`} aria-pressed={image?.id === screenshot.id} onClick={() => setSelectedImageId(screenshot.id)}>
                  <Image src={screenshot.src} alt="" width={160} height={90} sizes="76px" />
                </button>
              ))}
            </div>
          )}
          <p className="eyebrow">PROJECT SCREENSHOT / {number}</p>
        </div>
        <div className="detail-story">
          <p className="eyebrow">ABOUT THIS PROJECT</p>
          {project.description.length ? project.description.map((line, index) => <p key={index}>{line}</p>) : project.summary && <p>{project.summary}</p>}
          <div className="skill-tags">
            {project.technologies?.map((technology) => <span key={technology}>{technology.toUpperCase()}</span>)}
          </div>
          <div className="detail-links">
            <ProjectLink label="GitHub 저장소" eyebrow="SOURCE CODE" href={project.githubUrl} />
            <ProjectLink label={project.isCurrentSite ? "현재 보고 있는 페이지" : "실제 웹사이트"} eyebrow={project.isCurrentSite ? "LIVE WEBSITE / CURRENT PAGE" : "LIVE WEBSITE"} href={project.siteUrl} isCurrentPage={project.isCurrentSite} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectLink({ label, eyebrow, href, isCurrentPage = false, onClick }: { label: string; eyebrow: string; href?: string; isCurrentPage?: boolean; onClick?: () => void }) {
  // URL이 있으면 실제 링크, 없으면 클릭되지 않는 안내 카드가 된다. 임시 '#' 링크는 사용하지 않는다.
  // 외부 사이트는 새 탭으로 열며 noopener noreferrer를 지정한다. mailto는 메일 앱에 전달한다.
  const content = <><span className="eyebrow">{eyebrow}</span><strong>{label}</strong>{!isCurrentPage && <span className="external-arrow" aria-hidden="true">↗</span>}</>;

  // URL을 나중에 추가해도 현재 페이지를 새 탭으로 다시 열지 않는다.
  if (isCurrentPage) return <div className="link-card link-current">{content}</div>;
  if (onClick) return <button className="link-card" type="button" onClick={onClick}>{content}</button>;

  return href ? (
    <a className="link-card" href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}>{content}</a>
  ) : (
    <div className="link-card link-pending" aria-label={`${label}, 주소 준비 중`}>{content}</div>
  );
}

// 메일 카드는 작성 폼을 열고, GitHub 주소는 profile.ts에서 읽는다.
export function ContactContent({ onCompose }: { onCompose: () => void }) {
  return (
    <div className="contact-content">
      <p className="eyebrow">FILE / CONTACT</p>
      <div className="contact-heading">
        <h2>함께 이야기해요.</h2>
        <div className="contact-emblem" aria-hidden="true">
          <Image src="/assets/icons/contact-smooth.png" alt="" width={46} height={46} unoptimized />
        </div>
      </div>
      <div className="contact-links">
        <ProjectLink label="메일 보내기" eyebrow="EMAIL" onClick={onCompose} />
        <ProjectLink label="GitHub 방문" eyebrow="GITHUB" href={profile.githubUrl} />
      </div>
    </div>
  );
}
