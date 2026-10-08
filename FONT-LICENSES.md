# 사용 폰트와 라이선스

현재 사이트에서 내려받는 웹폰트는 아래 두 종류입니다. 둘 다 SIL Open Font License 1.1에 따라 개인·상업용 웹사이트에서 무료로 사용하고 웹폰트로 제공할 수 있습니다. 폰트 파일 자체의 단독 판매는 허용되지 않으며, 파일을 직접 재배포하거나 수정할 때는 저작권 고지와 라이선스 및 Reserved Font Name 조건을 지켜야 합니다.

| 폰트 | 용도 | 공급 방식 | 공식 라이선스 |
| --- | --- | --- | --- |
| Inconsolata | 영문 파일명, 정보, 작업 순서 번호 | jsDelivr의 `@fontsource-variable/inconsolata@5.2.5` 가변 WOFF2 | [OFL.txt](https://github.com/googlefonts/Inconsolata/blob/master/OFL.txt) |
| SUIT | 한글과 본문 | 기존 jsDelivr CDN, `projectnoonnu/noonfonts_suit@1.0` | [LICENSE](https://github.com/sun-typeface/SUIT/blob/main/LICENSE) |

설정은 `src/app/globals.css`의 `@font-face`와 `--font-mono`에 있습니다. Inconsolata는 영문 문자 범위에만 적용하고 한글은 SUIT를 사용합니다. `font-display: swap`으로 다운로드 중에도 대체 글꼴로 글자를 표시합니다.

기존 Consolas, Courier New, Malgun Gothic은 설치된 폰트를 참조하는 CSS 대체 폰트였으며, 폰트 파일을 배포하지 않았습니다. 이러한 참조는 [Microsoft 공식 안내](https://learn.microsoft.com/en-us/typography/fonts/font-faq#web)에서 허용하는 방식입니다. 현재 설정에서는 명시적인 참조를 제거하고 위의 오픈소스 웹폰트로 통일했습니다.
