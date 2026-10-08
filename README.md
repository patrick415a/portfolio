# Sungho 포트폴리오

바탕화면과 파일 창의 형태로 소개와 작업물을 보여 주는 Next.js 포트폴리오입니다.

## 실행

```powershell
npm ci
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다. 메일 전송을 사용하려면 `.env.example`을 참고해 루트에 `.env.local`을 만들고 Web3Forms Access Key를 설정하세요. 기존 `VITE_WEB3FORMS_ACCESS_KEY` 이름도 지원합니다. 자세한 설정은 [`docs/contact-form.md`](docs/contact-form.md)를 참고하세요. 배포 전에는 `npm run build`, 코드 검사는 `npm run lint`로 확인할 수 있습니다.

`.env.local`, 설치 패키지, 빌드 결과, 로컬 설정, 원본 사진과 보관용 디자인 자료는 Git에 포함하지 않습니다. 키가 없는 상태에서도 포트폴리오는 실행되며 메일 전송 버튼만 비활성화됩니다.

## 어디를 수정하면 되나요?

| 파일 | 역할 |
| --- | --- |
| [`src/app/page.tsx`](src/app/page.tsx) | 첫 화면을 불러오는 페이지 |
| [`src/components/PortfolioDesktop.tsx`](src/components/PortfolioDesktop.tsx) | 바탕화면, 아이콘, 창, 독, 테마와 상호작용 |
| [`src/components/WindowContent.tsx`](src/components/WindowContent.tsx) | About, Works, 프로젝트 상세, Contact의 내용 |
| [`src/components/NotesContent.tsx`](src/components/NotesContent.tsx) | 메모 입력, 브라우저 자동 저장, 저장 상태 표시 |
| [`src/components/ContactForm.tsx`](src/components/ContactForm.tsx) | 이름·이메일·내용 입력과 메일 전송 상태 처리 |
| [`src/components/PortfolioPreview.tsx`](src/components/PortfolioPreview.tsx) | 포트폴리오 카드와 상세 창의 바탕화면 미리보기 |
| [`src/app/globals.css`](src/app/globals.css) | 세 테마의 색과 PC·모바일 배치 |
| [`src/data/projects.ts`](src/data/projects.ts) | 프로젝트 카드와 상세 화면의 데이터 |
| [`src/data/profile.ts`](src/data/profile.ts) | Contact의 이메일·GitHub 주소 |
| [`public/assets`](public/assets) | 아이콘, 스크린샷, 별과 배경 SVG |

## 공부할 때 읽는 순서

소스의 한국어 주석은 각 기능의 역할과 그렇게 구현한 이유를 설명합니다. 처음부터 전체를 읽기보다 다음 순서로 한 기능씩 따라가 보세요.

1. `src/app/page.tsx`, `src/app/layout.tsx`: 페이지가 시작되는 곳과 공통 CSS가 연결되는 곳입니다.
2. `src/data/projects.ts`, `src/data/profile.ts`: 화면에 표시할 데이터를 정의합니다. 프로젝트 제목이나 설명부터 바꿔보면 데이터와 화면의 관계를 확인하기 쉽습니다.
3. `src/components/WindowContent.tsx`: 데이터를 카드와 상세 화면으로 만드는 부분입니다. `map`은 배열을 여러 요소로, `props`는 부모가 전달한 값을 의미합니다.
4. `src/components/PortfolioDesktop.tsx`의 `PortfolioDesktop` 함수: 창과 테마의 상태를 관리합니다. `openApp` → `windows` 변경 → `AppWindow` 표시 순서부터 따라가세요.
5. 같은 파일의 `DesktopShortcut`, `AppWindow`: 클릭·드래그·크기 조절 입력을 받고 부모의 함수를 호출합니다. `useRef`에 시작점을 저장하고, 이동량을 부모의 `useState`에 반영합니다.
6. 같은 파일의 `Wallpaper`: 마우스/터치 위치를 시선으로 바꾸는 과정입니다. `useEffect`에서 이벤트를 등록하고, `requestAnimationFrame`으로 조금씩 이동한 뒤 필요 없는 이벤트를 정리합니다.
7. `src/app/globals.css`: 테마 변수, 창의 배치, 모바일 규칙을 확인하세요. `--accent`나 제목의 `line-height`처럼 한 값씩 수정하면 변화가 눈에 잘 보입니다.
8. `src/components/AppIcon.tsx`, `scripts/render-app-icons.mjs`: 공통 아이콘 표시와 SVG를 부드러운 PNG로 만드는 작업입니다. SVG를 수정한 뒤 `node scripts/render-app-icons.mjs`를 직접 실행해 PNG를 갱신합니다.

예를 들어 Works 카드를 누르면 `WorksContent`가 `onOpenProject(project)`를 호출합니다. 부모의 `openProject`가 선택된 프로젝트를 저장하고 상세 창을 열면, `ProjectDetailContent`가 그 프로젝트를 전달받아 표시합니다. 이처럼 **입력 → 상태 변경 → 화면 표시**의 흐름으로 읽으면 됩니다.

주석은 브라우저 화면에 표시되지 않습니다. `public/assets/icons`의 SVG는 아이콘 원본이고 `*-smooth.png`는 변환 결과이므로, 그림을 바꾸려면 SVG를 먼저 편집하세요.

## 현재 동작

- PC: 아이콘 한 번 클릭으로 선택, 두 번 클릭으로 실행, 드래그로 이동, 오른쪽 위 버튼으로 위치 초기화
- 모바일: 아이콘 한 번 터치로 실행, 한 화면에 창 하나 표시
- 창: 제목줄로 앞쪽 배치·드래그, 오른쪽·아래쪽·오른쪽 아래 모서리로 크기 조절, 최소화·최대화·닫기, 독에서 열기·복원
- Works: 프로젝트 목록을 데이터에서 만들고 공개 프로젝트를 누르면 상세 창 표시
- portfolio.site: 현재 사이트의 소개와 기술을 상세 창에 표시. 웹사이트 항목은 클릭되지 않는 현재 페이지 안내
- Notes: 빈 메모장에 직접 입력하고 같은 브라우저에 자동 저장. 입력 내용은 사이트 운영자에게 전송되지 않음
- Contact: 메일 작성 폼과 Web3Forms 발송 연결. 환경 변수 설정은 [`docs/contact-form.md`](docs/contact-form.md) 참고
- 테마: Peach, Sky, Lilac 전환
- 배경: 천천히 회전하는 별과 PC에서는 마우스, 모바일에서는 마지막 터치 지점을 바라보는 두 캐릭터의 눈

현재 프로젝트 사이트·GitHub의 실제 주소는 제공받지 않아 링크를 연결하지 않았습니다. 주소를 받으면 `src/data/projects.ts`와 `src/data/profile.ts`에 추가하면 됩니다. 메일 폼은 Web3Forms 키가 설정되면 전송할 수 있습니다. `notes.txt`의 내용은 방문자 브라우저에만 저장됩니다. 브라우저 저장을 사용할 수 없으면 이번 방문 동안만 메모리에 보관하며 화면에 해당 상태를 표시합니다.

현재 Works에는 네 개의 카드가 표시됩니다. 새 작업이 생기면 `src/data/projects.ts`의 빈 자리를 수정하거나 항목을 하나씩 추가하고 `status`를 `public`으로 바꾸면 카드와 상세 창에 반영됩니다. 프로젝트가 늘어나면 Works 창의 목록을 스크롤할 수 있습니다.

처음 만들었던 디자인 자료는 `archive/final-design`에 보관되어 있습니다. 폴더 전체를 이미지로 붙인 구현이 아니라, 화면 요소를 HTML/CSS와 재사용 가능한 SVG로 구성했습니다.
