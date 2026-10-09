export const THEMES = ["peach", "sky", "lilac"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "peach";
export const THEME_STORAGE_KEY = "sungho-portfolio:theme:v1";

export function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme === value);
}

// head에서 화면이 그려지기 전에 실행한다. 사용자 입력 대신 정해진 테마 값만 적용한다.
// 저장소 접근이 차단되거나 값이 잘못됐으면 기본 Peach를 유지한다.
export const THEME_INIT_SCRIPT = `(() => {
  try {
    const theme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (${JSON.stringify(THEMES)}.includes(theme)) {
      document.documentElement.dataset.theme = theme;
    }
  } catch {}
})();`;
