# 캐릭터 프로필 이미지

- 사용 도구: 내장 `image_gen` (CLI/API 대체 방식 사용 안 함)
- 최종 파일: `public/assets/sungho-avatar.png`
- 참고 이미지: 사용자가 제공한 `ProfileView.jfif`
- 처리: 사진을 캐릭터로 변환한 뒤 단순한 선과 색으로 한 차례 다듬음. 배경은 투명.
- 적용 위치: About Me의 기존 원형 장식 안. 원본 사진은 사이트의 public 폴더에 복사하지 않음.

## 최종 변환 프롬프트

```text
Use case: style-transfer. Edit the supplied generated avatar into a MUCH SIMPLER flat cartoon portrait for a pastel desktop-themed portfolio. Preserve this exact person's hair silhouette, hairstyle, thin round eyeglasses, face proportions, calm small smile and black suit/white shirt/dark tie. This should resemble a charming simple editorial sticker, not detailed anime or a realistic painting. Use thick clean uniform dark-plum #2d2940 outlines, solid flat fills and at most one flat shadow per region. Draw hair as a few large rounded clumps, no fine hair strands or glossy highlights. Face: simple dark small eyes, minimal nose stroke, simple small mouth without rendered lips, warm peach skin and two tiny blush patches. Suit: simplified charcoal-plum jacket with clean geometric lapels, cream shirt and muted lilac-plum tie. Rounded softly geometric shapes matching a friendly desktop UI with peach #e9a186, cream #fffaf0 and lilac #d8d0ff. Centered head-and-shoulders bust in a square canvas, whole hair visible with comfortable margin. Transparent background. No text, border, disk, props or watermark. Adult proportions, recognizable person, no chibi or baby head.
```
