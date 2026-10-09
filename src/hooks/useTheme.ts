"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, isTheme, type Theme } from "@/data/themes";

const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  const theme = document.documentElement.dataset.theme;
  return isTheme(theme) ? theme : DEFAULT_THEME;
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // 같은 주소의 다른 탭에서 바꾼 테마도 반영한다. 저장값 삭제 시 기본 테마로 돌아간다.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    try {
      if (event.storageArea !== window.localStorage) return;
      applyTheme(isTheme(event.newValue) ? event.newValue : DEFAULT_THEME);
    } catch { /* 저장소가 차단되면 이번 방문에서 선택한 테마를 유지한다. */ }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch { /* 저장할 수 없어도 테마 선택 자체는 정상 동작한다. */ }
}

export function useTheme() {
  // 서버/첫 hydration은 기본값으로 맞추고 이후 실제 테마와 버튼의 접근성 상태를 동기화한다.
  // 화면 색은 head 스크립트와 CSS가 먼저 적용하므로 기본 테마가 잠깐 보이지 않는다.
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [theme, setTheme] as const;
}
