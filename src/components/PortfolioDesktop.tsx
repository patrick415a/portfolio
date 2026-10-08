"use client";

// 브라우저 이벤트와 React 상태를 쓰는 대화형 화면이다.
// 흐름: PortfolioDesktop(상태 관리) → AppWindow/Shortcut(입력 처리) → WindowContent(내용 표시).

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { projects, type Project } from "@/data/projects";
import { AboutContent, ContactContent, ProjectDetailContent, WorksContent } from "./WindowContent";
import { NotesContent } from "./NotesContent";
import { ContactForm, EMPTY_CONTACT_MESSAGE, type ContactMessage } from "./ContactForm";
import { isContactDeliveryConfigured, sendLetter } from "@/lib/contact";
import { AppIcon } from "./AppIcon";

type AppId = "about" | "works" | "notes" | "contact" | "project";
type ShortcutId = Exclude<AppId, "project">;
type Theme = "peach" | "sky" | "lilac";
type Point = { x: number; y: number };
type WindowSize = { width: number; height: number };
type ResizeDirection = "right" | "bottom" | "corner";
type WindowState = {
  // open은 실행 여부, minimized는 실행 중이지만 화면에서 숨긴 상태다.
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  z: number;
  // z가 클수록 앞에 표시된다. 위치·크기가 없으면 CSS의 기본 배치를 사용한다.
  position?: Point;
  size?: WindowSize;
};

// 창을 너무 줄여 내용과 조작 버튼이 사라지지 않도록 앱마다 최소 크기를 정한다.
const MIN_WINDOW_SIZE: Record<AppId, WindowSize> = {
  about: { width: 340, height: 260 },
  works: { width: 450, height: 300 },
  notes: { width: 470, height: 300 },
  contact: { width: 400, height: 280 },
  project: { width: 520, height: 350 },
};

function clamp(value: number, min: number, max: number) {
  // 값이 허용 범위를 벗어나면 가장 가까운 경계값으로 제한한다.
  return Math.max(min, Math.min(value, max));
}

// 바탕화면과 하단 독이 같은 목록을 공유한다. 프로젝트 상세는 Works 아이콘을 공유한다.
const SHORTCUTS: { id: ShortcutId; label: string }[] = [
  { id: "about", label: "about.txt" },
  { id: "works", label: "works" },
  { id: "notes", label: "notes.txt" },
  { id: "contact", label: "contact.txt" },
];
// 렌더링 순서이며, 실제 창의 앞뒤 순서는 각 창의 z 값으로 결정된다.
const WINDOW_ORDER: AppId[] = ["works", "about", "notes", "contact", "project"];
const WINDOW_TITLES: Record<AppId, string> = {
  about: "about_me.txt",
  works: `works / ${projects.length} items`,
  notes: "notes.txt",
  contact: "contact.txt",
  project: "project detail",
};
// PC 첫 화면은 About과 Works를 연다. 모바일에서 보이는 창은 mobileActive로 따로 정한다.
const INITIAL_WINDOWS: Record<AppId, WindowState> = {
  about: { open: true, minimized: false, maximized: false, z: 12 },
  works: { open: true, minimized: false, maximized: false, z: 11 },
  notes: { open: false, minimized: false, maximized: false, z: 10 },
  contact: { open: false, minimized: false, maximized: false, z: 10 },
  project: { open: false, minimized: false, maximized: false, z: 10 },
};

function isMobile() {
  // 서버에는 window가 없으므로 먼저 확인한다. 700px 기준은 CSS와 같아야 한다.
  return typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches;
}

function subscribeToYear(onChange: () => void) {
  // 페이지를 다시 보거나 브라우저로 돌아오면 연도를 다시 확인한다.
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function CurrentYear() {
  // getFullYear()는 방문자 기기의 현재 연도를 가져온다. 내년에 접속하면 2027이 표시된다.
  // 서버에서는 비워두고 브라우저에서 채워, 빌드 시점의 연도가 남거나 서버와 날짜가 어긋나는 것을 피한다.
  const year = useSyncExternalStore<number | null>(subscribeToYear, () => new Date().getFullYear(), () => null);
  return <span>{year}</span>;
}

function Wallpaper() {
  useEffect(() => {
    // useEffect는 화면이 브라우저에 붙은 뒤 실행되므로 실제 DOM을 조회할 수 있다.
    // 매 프레임 setState 대신 transform만 바꿔 전체 화면이 반복 렌더링되는 것을 피한다.
    const features = Array.from(document.querySelectorAll<HTMLElement>(".face-features"));
    const pupils = features.map((feature) => Array.from(feature.querySelectorAll<HTMLElement>(".pupil")));
    const current = features.map(() => ({ faceX: 0, faceY: 0, pupilX: 0, pupilY: 0 }));
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 700px)");
    let mobileGazeActive = false;
    let activePointerId: number | null = null;
    let frame = 0;

    const track = (event: { clientX: number; clientY: number }) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      wake();
    };
    const startTrack = (event: globalThis.PointerEvent) => {
      track(event);
      if (mobile.matches) {
        mobileGazeActive = true;
        activePointerId = event.pointerId;
      }
    };
    const moveTrack = (event: globalThis.PointerEvent) => {
      if (!mobile.matches || activePointerId === event.pointerId) track(event);
    };
    const stopTrack = (event: globalThis.PointerEvent) => {
      // 손을 떼도 마지막으로 터치한 방향을 바라본다. 다음 터치가 시선을 갱신한다.
      if (activePointerId === event.pointerId) activePointerId = null;
    };
    const moveTouch = (event: TouchEvent) => {
      if (!mobile.matches || !event.touches[0]) return;
      mobileGazeActive = true;
      track(event.touches[0]);
    };
    const animate = () => {
      frame = 0;
      if (reducedMotion.matches || document.hidden) return;
      let moving = false;
      const approach = (value: number, target: number, speed: number) => {
        // 목표와의 차이를 조금씩 줄이는 보간이다. speed가 클수록 빠르게 따라간다.
        // 거의 도착했을 때 정확한 목표값으로 맞춰 끝없이 애니메이션이 돌지 않게 한다.
        if (Math.abs(target - value) < 0.02) return target;
        moving = true;
        return value + (target - value) * speed;
      };
      features.forEach((feature, index) => {
        const face = feature.parentElement;
        if (!face) return;
        const bounds = face.getBoundingClientRect();
        const dx = pointer.x - (bounds.left + bounds.width / 2);
        const dy = pointer.y - (bounds.top + bounds.height / 2);
        const distance = Math.hypot(dx, dy) || 1;
        // dx/distance, dy/distance는 방향이다. strength는 거리에 따른 이동량(최대 1)이다.
        // 모바일은 첫 터치 전까지 정면을 보며, 180/500을 줄이면 더 민감하게 반응한다.
        const strength = Math.min(distance / (mobile.matches ? 180 : 500), 1);
        const canTrack = !reducedMotion.matches && (!mobile.matches || mobileGazeActive);
        const gazeX = canTrack ? (dx / distance) * strength : 0;
        const gazeY = canTrack ? (dy / distance) * strength : 0;
        const position = current[index];

        // 눈동자는 먼저, 얼굴은 조금 늦게 움직여 시선이 커서를 따라가는 느낌을 준다.
        position.faceX = approach(position.faceX, gazeX * 15, 0.09);
        position.faceY = approach(position.faceY, gazeY * 12, 0.09);
        position.pupilX = approach(position.pupilX, gazeX * (mobile.matches ? 8 : 6), 0.18);
        position.pupilY = approach(position.pupilY, gazeY * (mobile.matches ? 6 : 5), 0.18);
        feature.style.transform = `translate3d(${position.faceX}px, ${position.faceY}px, 0)`;
        pupils[index].forEach((pupil) => {
          pupil.style.transform = `translate3d(${position.pupilX}px, ${position.pupilY}px, 0)`;
        });
      });
      // 목표에 도달하면 쉬고, 포인터·터치·화면 크기가 바뀔 때 다시 시작한다.
      if (moving) frame = requestAnimationFrame(animate);
    };
    const wake = () => {
      // requestAnimationFrame은 다음 화면 갱신 때 실행한다. frame으로 중복 예약을 막는다.
      if (!frame && !reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(animate);
    };
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const syncMotionPreference = () => {
      // 운영체제의 '동작 줄이기' 설정이 켜지면 시선을 가운데로 돌리고 움직임을 멈춘다.
      pause();
      if (reducedMotion.matches) {
        features.forEach((feature, index) => {
          current[index] = { faceX: 0, faceY: 0, pupilX: 0, pupilY: 0 };
          feature.style.transform = "translate3d(0, 0, 0)";
          pupils[index].forEach((pupil) => { pupil.style.transform = "translate3d(0, 0, 0)"; });
        });
      } else wake();
    };
    const syncVisibility = () => {
      if (document.hidden) pause();
      else wake();
    };

    // capture로 앱 안의 터치도 관찰하고, passive로 모바일의 기본 스크롤을 방해하지 않는다.
    window.addEventListener("pointerdown", startTrack, { passive: true, capture: true });
    window.addEventListener("pointermove", moveTrack, { passive: true, capture: true });
    window.addEventListener("pointerup", stopTrack, { passive: true, capture: true });
    window.addEventListener("pointercancel", stopTrack, { passive: true, capture: true });
    window.addEventListener("touchmove", moveTouch, { passive: true, capture: true });
    window.addEventListener("resize", wake);
    document.addEventListener("visibilitychange", syncVisibility);
    reducedMotion.addEventListener("change", syncMotionPreference);
    mobile.addEventListener("change", wake);
    wake();
    return () => {
      // 화면이 사라지거나 Effect가 다시 설정될 때 이벤트와 예약된 프레임을 정리한다.
      window.removeEventListener("pointerdown", startTrack, true);
      window.removeEventListener("pointermove", moveTrack, true);
      window.removeEventListener("pointerup", stopTrack, true);
      window.removeEventListener("pointercancel", stopTrack, true);
      window.removeEventListener("touchmove", moveTouch, true);
      window.removeEventListener("resize", wake);
      document.removeEventListener("visibilitychange", syncVisibility);
      reducedMotion.removeEventListener("change", syncMotionPreference);
      mobile.removeEventListener("change", wake);
      pause();
    };
  }, []);

  return (
    <div className="wallpaper" aria-hidden="true">
      <div className="wallpaper-circle circle-right" />
      <div className="wallpaper-circle circle-left" />
      <div className="face face-left"><FaceFeatures /></div>
      <div className="face face-right"><FaceFeatures /></div>
      <Image className="rotating-star" src="/assets/star.svg" width={140} height={140} alt="" priority />
    </div>
  );
}

// 얼굴 전체와 눈동자를 별도 요소로 만들어 각각 다른 속도로 움직일 수 있다.
function FaceFeatures() {
  return (
    <div className="face-features">
      <div className="face-eye"><span className="pupil" /></div>
      <div className="face-eye"><span className="pupil" /></div>
      <span className="face-brow brow-one" />
      <span className="face-brow brow-two" />
    </div>
  );
}

type ShortcutProps = {
  id: ShortcutId;
  label: string;
  index: number;
  selected: boolean;
  offset: Point;
  onSelect: (id: ShortcutId) => void;
  onOpen: (id: ShortcutId) => void;
  onMove: (id: ShortcutId, point: Point) => void;
};

function DesktopShortcut({ id, label, index, selected, offset, onSelect, onOpen, onMove }: ShortcutProps) {
  // useRef는 렌더링 사이에도 값을 보관하지만, 값이 바뀌어도 렌더링을 요청하지 않는다.
  // 드래그 시작점은 ref에, 실제 화면에 표시할 최종 위치는 부모의 state에 저장한다.
  const drag = useRef<{ pointerId: number; startX: number; startY: number; offset: Point; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const pointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (isMobile() || event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, offset, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    // 포인터가 버튼 밖으로 나가도 드래그 이벤트를 계속 이 버튼에서 받는다.
  };
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.current.startX;
    const dy = event.clientY - drag.current.startY;
    // 5px 정도의 작은 손 떨림은 클릭으로 취급한다. 시작 위치 + 이동량으로 계산한다.
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.current.moved = true;
    if (drag.current.moved) onMove(id, { x: drag.current.offset.x + dx, y: drag.current.offset.y + dy });
  };
  const pointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    suppressClick.current = drag.current.moved;
    // 드래그 후 발생하는 click이 아이콘 선택/실행으로 이어지지 않도록 한 번 막는다.
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  // CSS 변수로 이동량을 전달한다. PC는 한 번 클릭해 선택, 더블클릭해 실행하고 모바일은 탭으로 실행한다.
  return (
    <button
      className={`desktop-shortcut ${selected ? "is-selected" : ""}`}
      style={{ "--shortcut-index": index, "--offset-x": `${offset.x}px`, "--offset-y": `${offset.y}px` } as CSSProperties}
      type="button"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onClick={() => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        if (isMobile()) onOpen(id);
        else onSelect(id);
      }}
      onDoubleClick={() => { if (!isMobile()) onOpen(id); }}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(id); } }}
      aria-label={`${label} 열기`}
    >
      <AppIcon name={id} />
      <span>{label}</span>
    </button>
  );
}

type AppWindowProps = {
  id: AppId;
  title: string;
  state: WindowState;
  mobileVisible: boolean;
  onFocus: (id: AppId) => void;
  onMove: (id: AppId, point: Point) => void;
  onResize: (id: AppId, size: WindowSize) => void;
  onMinimize: (id: AppId) => void;
  onMaximize: (id: AppId) => void;
  onClose: (id: AppId) => void;
  children: React.ReactNode;
};

function AppWindow({ id, title, state, mobileVisible, onFocus, onMove, onResize, onMinimize, onMaximize, onClose, children }: AppWindowProps) {
  // 모든 앱이 공유하는 창 틀이다. children에 각 앱의 내용이 들어오고 콜백으로 부모 상태를 바꾼다.
  const drag = useRef<{ pointerId: number; startX: number; startY: number; left: number; top: number } | null>(null);
  const resize = useRef<{ pointerId: number; startX: number; startY: number; size: WindowSize; max: WindowSize; direction: ResizeDirection } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // PC 기본 창은 내용이 넘칠 때만 늘린다. 수동 크기와 메모장의 입력 영역은 유지한다.
    if (id === "notes" || !state.open || state.minimized || state.maximized || state.size) return;
    const body = bodyRef.current;
    const content = body?.firstElementChild;
    const element = body?.parentElement;
    const titlebar = element?.querySelector<HTMLElement>(".window-titlebar");
    if (!content || !element || !titlebar) return;
    const desktop = window.matchMedia("(min-width: 701px)");
    const fitHeight = () => {
      if (!desktop.matches) {
        element.style.removeProperty("--content-height");
        return;
      }
      const border = getComputedStyle(element);
      const height = Math.ceil(content.getBoundingClientRect().height + titlebar.getBoundingClientRect().height
        + parseFloat(border.borderTopWidth) + parseFloat(border.borderBottomWidth)) + 1;
      element.style.setProperty("--content-height", `${height}px`);
    };
    // 글꼴 로드, 화면 폭, 프로젝트/폼 내용 변화도 실제 높이로 다시 계산한다.
    const observer = new ResizeObserver(fitHeight);
    observer.observe(content);
    desktop.addEventListener("change", fitHeight);
    fitHeight();
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", fitHeight);
      element.style.removeProperty("--content-height");
    };
  }, [id, state.open, state.minimized, state.maximized, state.size, title]);

  if (!state.open || state.minimized) return null;
  // null이면 창 DOM을 만들지 않는다. 실행 여부와 저장된 위치·크기는 부모에 계속 남아 있다.

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    onFocus(id);
    if (isMobile() || state.maximized || event.button !== 0) return;
    const element = event.currentTarget.closest<HTMLElement>(".app-window");
    if (!element) return;
    const rect = element.getBoundingClientRect();
    // 현재 보이는 창의 화면 좌표를 출발점으로 저장한다. 최대화/모바일에서는 이동하지 않는다.
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    // 시작 좌표에 포인터 이동량을 더한다. CSS도 실제 창 크기를 고려해 화면 경계를 제한한다.
    if (drag.current?.pointerId !== event.pointerId) return;
    const x = Math.max(0, Math.min(window.innerWidth - 80, drag.current.left + event.clientX - drag.current.startX));
    const y = Math.max(0, Math.min(window.innerHeight - 32, drag.current.top + event.clientY - drag.current.startY));
    onMove(id, { x, y });
  };
  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const startResize = (event: PointerEvent<HTMLButtonElement>, direction: ResizeDirection) => {
    // 크기 조절을 시작한 순간의 크기와 화면에 남은 공간을 저장한다.
    if (isMobile() || state.maximized || event.button !== 0) return;
    const element = event.currentTarget.closest<HTMLElement>(".app-window");
    if (!element) return;
    event.preventDefault();
    const rect = element.getBoundingClientRect();
    resize.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      size: { width: rect.width, height: rect.height },
      max: {
        width: Math.max(MIN_WINDOW_SIZE[id].width, window.innerWidth - rect.left - 8),
        height: Math.max(MIN_WINDOW_SIZE[id].height, window.innerHeight - rect.top - 8),
      },
      direction,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveResize = (event: PointerEvent<HTMLButtonElement>) => {
    // 오른쪽은 너비만, 아래쪽은 높이만, 모서리는 둘 다 바꾼다. 최소/최대 크기로 제한한다.
    const active = resize.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const width = active.direction === "bottom" ? active.size.width : clamp(active.size.width + event.clientX - active.startX, MIN_WINDOW_SIZE[id].width, active.max.width);
    const height = active.direction === "right" ? active.size.height : clamp(active.size.height + event.clientY - active.startY, MIN_WINDOW_SIZE[id].height, active.max.height);
    onResize(id, { width, height });
  };
  const endResize = (event: PointerEvent<HTMLButtonElement>) => {
    if (resize.current?.pointerId !== event.pointerId) return;
    resize.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const resizeWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>, direction: ResizeDirection) => {
    // 조절 핸들에 포커스가 있으면 방향키로 20px, Shift와 함께 누르면 40px씩 조절한다.
    if (isMobile() || state.maximized) return;
    const horizontal = direction !== "bottom" && (event.key === "ArrowLeft" || event.key === "ArrowRight");
    const vertical = direction !== "right" && (event.key === "ArrowUp" || event.key === "ArrowDown");
    if (!horizontal && !vertical) return;
    const element = event.currentTarget.closest<HTMLElement>(".app-window");
    if (!element) return;
    event.preventDefault();
    const rect = element.getBoundingClientRect();
    const step = event.shiftKey ? 40 : 20;
    const width = horizontal ? clamp(rect.width + (event.key === "ArrowRight" ? step : -step), MIN_WINDOW_SIZE[id].width, Math.max(MIN_WINDOW_SIZE[id].width, window.innerWidth - rect.left - 8)) : rect.width;
    const height = vertical ? clamp(rect.height + (event.key === "ArrowDown" ? step : -step), MIN_WINDOW_SIZE[id].height, Math.max(MIN_WINDOW_SIZE[id].height, window.innerHeight - rect.top - 8)) : rect.height;
    onResize(id, { width, height });
  };
  // 모든 창은 같은 z 순서를 사용해, 최대화 중에도 독에서 다른 앱을 앞으로 가져올 수 있습니다.
  const style: CSSProperties & { "--resize-width"?: string; "--resize-height"?: string; "--window-x"?: string; "--window-y"?: string } = { zIndex: state.z };
  // 최대화는 CSS에서 이 값들을 덮어쓴다. 원래 위치·크기는 유지되어 복원할 때 다시 쓰인다.
  if (state.position) { style["--window-x"] = `${state.position.x}px`; style["--window-y"] = `${state.position.y}px`; }
  if (state.size) { style["--resize-width"] = `${state.size.width}px`; style["--resize-height"] = `${state.size.height}px`; }

  return (
    <section
      className={`app-window window-${id} ${id === "works" && projects.length > 4 ? "has-many-projects" : ""} ${state.maximized ? "is-maximized" : ""} ${mobileVisible ? "mobile-visible" : ""}`}
      style={style}
      aria-label={title}
      onPointerDown={() => onFocus(id)}
    >
      <header
        className="window-titlebar"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onDoubleClick={() => onMaximize(id)}
      >
        <span className="window-title">{title}</span>
        <div className="window-controls">
          <button className="control control-minimize" type="button" aria-label={`${title} 최소화`} onPointerDown={(event) => event.stopPropagation()} onClick={() => onMinimize(id)} />
          <button className="control control-maximize" type="button" aria-label={`${title} ${state.maximized ? "이전 크기로" : "최대화"}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => onMaximize(id)} />
          <button className="control control-close" type="button" aria-label={`${title} 닫기`} onPointerDown={(event) => event.stopPropagation()} onClick={() => onClose(id)} />
        </div>
      </header>
      <div className="window-body" ref={bodyRef}>{children}</div>
      {(["right", "bottom", "corner"] as ResizeDirection[]).map((direction) => (
        <button
          key={direction}
          className={`resize-handle resize-${direction}`}
          type="button"
          aria-label={`${title} ${direction === "right" ? "가로" : direction === "bottom" ? "세로" : "대각선"} 크기 조절`}
          onPointerDown={(event) => startResize(event, direction)}
          onPointerMove={moveResize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          onKeyDown={(event) => resizeWithKeyboard(event, direction)}
        />
      ))}
    </section>
  );
}

export default function PortfolioDesktop() {
  // useState 값이 바뀌면 React가 화면을 다시 계산한다. 앱 간 공유 상태는 이 부모에 모은다.
  const [theme, setTheme] = useState<Theme>("peach");
  const [windows, setWindows] = useState<Record<AppId, WindowState>>(INITIAL_WINDOWS);
  const [mobileActive, setMobileActive] = useState<AppId | null>("about");
  // PC는 여러 창을 겹쳐 보여주지만 모바일은 이 id와 일치하는 창 하나만 표시한다.
  const [selected, setSelected] = useState<ShortcutId | null>(null);
  const [iconOffsets, setIconOffsets] = useState<Record<ShortcutId, Point>>({
    about: { x: 0, y: 0 }, works: { x: 0, y: 0 }, notes: { x: 0, y: 0 }, contact: { x: 0, y: 0 },
  });
  const [currentProject, setCurrentProject] = useState<Project>(projects[0]);
  const [contactView, setContactView] = useState<"links" | "compose">("links");
  // 폼 입력은 부모가 보관해 최소화·닫기 후에도 이번 방문 중에는 유지한다.
  const [contactDraft, setContactDraft] = useState<ContactMessage>(EMPTY_CONTACT_MESSAGE);
  const nextZ = useRef(12);
  // 순번 자체는 화면에 표시하지 않으므로 ref를 쓴다. 실제 z 값은 windows state에 저장한다.

  const bringFront = (id: AppId) => {
    // 제목줄이나 창 내용을 누를 때 가장 큰 z 값을 주어 PC의 창 겹침을 관리합니다.
    const z = ++nextZ.current;
    setWindows((current) => ({ ...current, [id]: { ...current[id], z } }));
  };
  const openApp = (id: AppId) => {
    // 닫힌 창을 열거나 최소화된 창을 복원한다. 기존 위치와 크기는 유지한다.
    const z = ++nextZ.current;
    setWindows((current) => ({ ...current, [id]: { ...current[id], open: true, minimized: false, z } }));
    setMobileActive(id);
    setSelected(null);
  };
  const minimize = (id: AppId) => {
    // open은 유지한다. 따라서 창은 숨겨져도 독의 실행 중 표시는 남는다.
    setWindows((current) => ({ ...current, [id]: { ...current[id], minimized: true } }));
    if (isMobile()) setMobileActive(null);
  };
  const close = (id: AppId) => {
    // 실행을 종료한다. 모바일 상세 창을 닫으면 프로젝트 목록(Works)으로 돌아간다.
    setWindows((current) => ({ ...current, [id]: { ...current[id], open: false, minimized: false, maximized: false } }));
    if (id === "contact") setContactView("links");
    if (isMobile()) {
      if (id === "project") openApp("works");
      else setMobileActive(null);
    }
  };
  const maximize = (id: AppId) => {
    // !로 최대화 여부를 뒤집는다. 크기 값은 바꾸지 않고 CSS 클래스가 화면을 채우게 한다.
    const z = ++nextZ.current;
    setWindows((current) => ({ ...current, [id]: { ...current[id], maximized: !current[id].maximized, z } }));
    setMobileActive(id);
  };
  const moveWindow = (id: AppId, point: Point) => {
    // 함수형 갱신은 최신 상태를 받는다. ...로 다른 창과 이 창의 나머지 속성을 보존한다.
    setWindows((current) => ({ ...current, [id]: { ...current[id], position: point } }));
  };
  const resizeWindow = (id: AppId, size: WindowSize) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], size } }));
  };
  const openProject = (project: Project) => {
    // 클릭한 프로젝트 데이터를 먼저 선택하고, 같은 상세 창 틀에 그 내용을 보여준다.
    setCurrentProject(project);
    openApp("project");
  };
  // 별도 활성 상태를 중복 저장하지 않고, 보이는 창 중 z가 가장 큰 창을 계산한다.
  const activeDesktop = WINDOW_ORDER.filter((id) => windows[id].open && !windows[id].minimized).sort((a, b) => windows[b].z - windows[a].z)[0];
  const dockClick = (id: ShortcutId) => {
    // Works와 상세 창이 독 아이콘 하나를 공유한다. 최소화된 상세 창부터 복원한다.
    const target: AppId = id === "works" && windows.project.open && (
      windows.project.minimized || !windows.works.open || windows.works.minimized || windows.project.z > windows.works.z
    ) ? "project" : id;
    const running = windows[target].open;
    const active = isMobile() ? mobileActive === target : activeDesktop === target;
    // 이미 맨 앞인 앱은 최소화하고, 나머지는 앞으로 가져오거나 실행한다.
    if (running && !windows[target].minimized && active) minimize(target);
    else openApp(target);
  };
  const mobileWindowOpen = mobileActive !== null && windows[mobileActive].open && !windows[mobileActive].minimized;
  const mobileMaximized = mobileWindowOpen && mobileActive !== null && windows[mobileActive].maximized;

  // 창의 공통 조작과 앱별 내용은 분리한다. Works는 클릭 콜백, 상세는 선택된 데이터를 받는다.
  const windowContent: Record<AppId, React.ReactNode> = {
    about: <AboutContent />,
    works: <WorksContent onOpenProject={openProject} />,
    notes: <NotesContent />,
    contact: contactView === "compose" ? (
      <ContactForm draft={contactDraft} onDraftChange={setContactDraft} onBack={() => setContactView("links")} onSend={isContactDeliveryConfigured ? sendLetter : undefined} />
    ) : <ContactContent onCompose={() => setContactView("compose")} />,
    project: <ProjectDetailContent project={currentProject} />,
  };

  return (
    <main className={`desktop theme-${theme} ${mobileWindowOpen ? "has-mobile-window" : ""} ${mobileMaximized ? "has-mobile-maximized" : ""} ${WINDOW_ORDER.some((id) => windows[id].open && !windows[id].minimized && windows[id].maximized) ? "has-maximized" : ""}`} onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <Wallpaper />
      <p className="welcome">WELCOME TO SUNGHO&apos;S DESKTOP / <CurrentYear /></p>
      <div className="top-actions">
        <button className="reset-icons" type="button" onClick={() => { setIconOffsets({ about: { x: 0, y: 0 }, works: { x: 0, y: 0 }, notes: { x: 0, y: 0 }, contact: { x: 0, y: 0 } }); setSelected(null); }} aria-label="아이콘 위치 초기화" title="아이콘 위치 초기화">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 7.5a7 7 0 1 0 1.4 6.8" /><path d="M18 3.5v5h-5" /></svg>
        </button>
        <div className="theme-picker" role="group" aria-label="색상 테마 선택">
          <span>테마</span>
          {(["peach", "sky", "lilac"] as Theme[]).map((color) => (
            <button key={color} className={`theme-swatch swatch-${color} ${theme === color ? "selected" : ""}`} type="button" onClick={() => setTheme(color)} aria-label={`${color} 테마`} aria-pressed={theme === color} title={`${color} 테마`} />
          ))}
        </div>
      </div>
      <h1 className="hero-title"><span>내 생각을</span><span><em>움직이는</em> 작업실.</span></h1>
      <nav className="desktop-shortcuts" aria-label="바탕화면 파일">
        {SHORTCUTS.map((shortcut, index) => (
          <DesktopShortcut key={shortcut.id} {...shortcut} index={index} selected={selected === shortcut.id} offset={iconOffsets[shortcut.id]} onSelect={setSelected} onOpen={openApp} onMove={(id, point) => setIconOffsets((current) => ({ ...current, [id]: point }))} />
        ))}
      </nav>
      <div className="windows-layer">
        {WINDOW_ORDER.map((id) => (
          <AppWindow key={id} id={id} title={id === "project" ? `${currentProject.title} / project detail` : id === "contact" && contactView === "compose" ? "new_message.txt" : WINDOW_TITLES[id]} state={windows[id]} mobileVisible={mobileActive === id} onFocus={bringFront} onMove={moveWindow} onResize={resizeWindow} onMinimize={minimize} onMaximize={maximize} onClose={close}>
            {windowContent[id]}
          </AppWindow>
        ))}
      </div>
      <p className="desktop-help">OPEN MULTIPLE WINDOWS ✳<br />DRAG · MAXIMIZE · EXPLORE</p>
      <nav className="dock" aria-label="앱 독">
        {SHORTCUTS.map((shortcut) => {
          // 실행 여부와 활성 여부는 다르다. CSS가 실행 중이면 짧은 회색 줄,
          // 해당 기기에서 활성화된 창이면 긴 테마 색 줄을 표시한다.
          const running = windows[shortcut.id].open || (shortcut.id === "works" && windows.project.open);
          const desktopActive = running && (activeDesktop === shortcut.id || (shortcut.id === "works" && activeDesktop === "project"));
          const mobileDockActive = mobileWindowOpen && (mobileActive === shortcut.id || (shortcut.id === "works" && mobileActive === "project"));
          return (
            <button className={`dock-item ${running ? "is-running" : ""} ${desktopActive ? "is-active-desktop" : ""} ${mobileDockActive ? "is-active-mobile" : ""}`} type="button" key={shortcut.id} onClick={() => dockClick(shortcut.id)} aria-label={`${shortcut.label} ${running ? "열거나 복원" : "열기"}`} title={shortcut.label}>
              <AppIcon name={shortcut.id} />
              <span className="dock-indicator" />
            </button>
          );
        })}
      </nav>
    </main>
  );
}
