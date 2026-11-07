# Pixel Studio

브라우저에서 직접 그리거나, AI가 만든 JSON 명령을 실행해 픽셀 아트를 만드는 정적 웹앱입니다. 현재 프로젝트는 HTML, CSS, 순수 JavaScript로 구성되어 별도 패키지 설치나 빌드 과정이 없습니다.

다른 에이전트가 개발을 이어갈 때는 [AGENTS.md](./AGENTS.md)의 구조, 상태 모델, JSON 규격과 수정 지침을 먼저 확인하세요.

## 실행

`index.html`을 브라우저에서 엽니다. 작업 내용과 설정은 `localStorage`에 자동 저장됩니다. 저장된 작업은 같은 브라우저 프로필에서 다시 열 때 복원됩니다.

## 사이트 메타데이터

`index.html`에는 한국어 페이지 제목·설명, canonical URL, Open Graph 및 Twitter 공유 메타데이터, SVG favicon이 설정되어 있습니다. 공개 주소 `https://pixelatelier.vercel.app/` 기준으로 루트 `robots.txt`와 단일 페이지 `sitemap.xml`을 제공합니다. 배포 도메인이 바뀌면 canonical, `og:url`, sitemap URL과 robots.txt의 Sitemap 항목을 함께 갱신하세요. 사이트를 배포하는 것만으로 검색 노출이 보장되지는 않습니다.

## 별도 서브프로젝트

`SubProjects/`는 현재 픽셀 스튜디오와 관계없는 독립 실험·배포용 프로젝트 경로이며, 루트 `.gitignore`에서 제외됩니다. 프로젝트별로 자체 실행 방법과 `README.md`, `AGENTS.md`를 관리하고 독립 저장소/배포 단위로 다룹니다. 현재 서브프로젝트는 `PixelMotionStudio/`의 프레임 순서 관리 및 GIF 제작 웹앱입니다.

## 캔버스와 픽셀 밀도

화면 표시 캔버스는 400×400이고, 저장되는 실제 픽셀 격자는 각 축 16–512로 설정합니다. 기본값은 128×128, 총 16,384픽셀입니다. 픽셀 가이드는 이 실제 격자와 같은 좌표·비율로 그리며, 캔버스가 직사각형이면 정사각형 칸을 유지한 채 가운데 맞춥니다. **픽셀 가이드**와 **투명 배경 체크무늬**는 서로 독립적으로 켜고 끕니다. 체크무늬를 꺼도 픽셀 가이드는 남고, 선택한 단색 배경이 표시됩니다. 두 보기 설정은 그림 데이터와 PNG 내보내기에 포함되지 않습니다. 배경색과 체크무늬 설정은 이 브라우저에 저장됩니다.

| JSON 프리셋 키 | 화면 이름 | 격자 크기 |
| --- | --- | ---: |
| `coarse32` | 거친 | 32×32 |
| `small64` | 낮은 밀도 | 64×64 |
| `classic128` | 기본 | 128×128 |
| `detail192` | 세밀 | 192×192 |
| `fine256` | 고밀도 | 256×256 |
| `veryFine384` | 초고밀도 | 384×384 |
| `ultra512` | 최대 밀도 | 512×512 |

프리셋을 고르거나 가로·세로 값을 직접 입력할 수 있습니다. 격자 크기를 바꾸면 기존 그림을 최근접 픽셀 방식으로 새 크기에 맞춥니다. 새 크기는 자동 저장되며 실행 취소할 수 있습니다.

## 편집 도구

- 연필 `B`, 지우개 `E`, 채우기 `G`, 직선 `L`, 사각형 `R`, 스포이트 `I`
- 실행 취소 `Ctrl+Z`, 다시 실행 `Ctrl+Shift+Z` 또는 `Ctrl+Y`
- 색상 선택기, 사용자 팔레트, 저장 픽셀 크기에 맞춘 픽셀 가이드, 투명 체크무늬 별도 전환, 확대 보기
- 이미지를 가져와 16/32/64색으로 양자화: 비율을 유지해 전체 담기, 비율을 유지해 잘라 채우기, 목표 격자에 늘이기
- 논리 격자 크기의 PNG 내보내기
- 라이트/다크 테마

이미지 가져오기는 현재 격자 크기로 축소합니다. `contain`은 여백을 투명하게 두고 전체 이미지를 보존하며, `cover`는 넘치는 부분을 잘라 캔버스를 채우고, `stretch`는 이미지 비율을 변경합니다. PNG의 알파값이 128 미만인 픽셀은 색을 지정하지 않은 빈 픽셀(RGBA `0,0,0,0`)로 남기고, 나머지 픽셀은 선택한 색상 수로 양자화합니다. 가져온 이미지는 실행 취소 기록에 한 번의 편집으로 추가됩니다.

## JSON 파일

Pixel Studio는 용도가 다른 두 JSON 형식을 제공합니다.

### 프로젝트 파일: 그림과 설정 보존

상단의 **프로젝트 JSON**은 픽셀 데이터와 편집 설정을 함께 저장합니다. **JSON 열기**에서 프로젝트 파일을 고르면 즉시 프로젝트를 불러옵니다.

```json
{
  "format": "pixel-studio-project",
  "version": 1,
  "settings": {
    "preset": "classic128",
    "canvas": { "width": 128, "height": 128 },
    "display": { "width": 400, "height": 400 },
    "pixelDensity": { "width": 128, "height": 128, "total": 16384 },
    "grid": { "visible": true },
    "imageImport": { "colorCount": 32, "fit": "contain" },
    "editor": {
      "theme": "dark",
      "zoom": 1,
      "tool": "pencil",
      "activeColor": "#273b3a"
    },
    "palette": ["#273b3a", "#819783"]
  },
  "pixels": {
    "encoding": "base64-rgba",
    "data": "..."
  }
}
```

`pixels.data`는 왼쪽 위부터 행 순서로 저장한 RGBA 8비트 배열의 Base64입니다. 픽셀 하나당 R, G, B, A 각 1바이트이며, 배열 길이는 `width × height × 4`입니다. 프로젝트 형식은 전체 그림을 정확하게 보존하고 공유할 때 사용합니다.

RGBA 알파 채널을 지원하므로 프로젝트 JSON은 투명 배경 픽셀을 보존합니다. 캔버스의 체크무늬는 투명 영역을 화면에서 구분하기 위한 표시이며 PNG 내보내기에서는 배경으로 들어가지 않습니다. 명령 JSON의 색상 명령은 불투명한 `#RRGGBB` 색상만 지원합니다.

새 캔버스와 지우개·전체 지우기는 투명 상태로 초기화됩니다. 이전 버전에 자동 저장된 전체 검정 캔버스만 빈 상태로 한 번 초기화하며, 다른 자동 저장 그림은 복원합니다.

### 명령 파일: AI 설정과 그리기 지시

우측 **AI 스튜디오**에서 JSON 명령을 붙여넣고 실행합니다. **예시 명령**은 현재 격자 크기에 맞는 문서를 채웁니다. **JSON 파일 열기**는 명령 문서를 편집기에 불러오며, 불러온 뒤 **명령 실행하기**를 눌러 적용합니다. **명령 JSON 다운로드**는 편집기 내용과 설정을 공유 가능한 파일로 저장합니다.

```json
{
  "format": "pixel-studio-commands",
  "version": 1,
  "settings": {
    "preset": "fine256",
    "canvas": { "width": 256, "height": 256 },
    "pixelDensity": { "width": 256, "height": 256, "total": 65536 },
    "display": { "width": 400, "height": 400 },
    "grid": { "visible": true },
    "imageImport": { "colorCount": 32, "fit": "contain" },
    "editor": {
      "theme": "dark",
      "zoom": 1,
      "tool": "pencil",
      "activeColor": "#273b3a"
    },
    "palette": ["#273b3a", "#e28a5b"]
  },
  "commands": [
    {
      "op": "fillRect",
      "x": 40,
      "y": 40,
      "width": 48,
      "height": 48,
      "color": "#e28a5b"
    },
    {
      "op": "fillPolygon",
      "points": [[64, 20], [100, 58], [28, 58]],
      "color": "#273b3a"
    },
    { "op": "setPixel", "x": 64, "y": 64, "color": "#ffffff" }
  ]
}
```

`settings`는 선택 항목입니다. 캔버스 크기는 `canvas.width`/`height`로 직접 지정하거나 `preset`으로 지정합니다. 둘 다 있으면 `canvas`의 값이 우선합니다. 지원되는 추가 설정은 `pixelDensity.width`/`height`, `grid.visible`, `imageImport.colorCount`(16, 32, 64), `imageImport.fit`(`contain`, `cover`, `stretch`), `editor.theme`(`light`, `dark`), `editor.zoom`(0.7–1.5), `editor.tool`, `editor.activeColor`, `palette`입니다. 표시 캔버스 크기는 현재 400×400으로 고정되어 내보낸 설정값은 기록용이며 변경 대상으로 사용되지 않습니다.

## 고급 이미지 일괄 변환

기존 작업 공간 아래의 **이미지 일괄 픽셀 변환** 패널에서 여러 이미지 파일을 한 번에 선택하거나 끌어놓습니다. 이 패널은 메인 그리기 캔버스와 독립적이며 대기열의 이미지를 캔버스에 적용하지 않습니다.

- 기존 그리기 모드와 같은 픽셀 프리셋(32²부터 512², 사용자 크기), 색상 수(16/32/64), 맞춤 방식(`contain`, `cover`, `stretch`)을 별도로 지정합니다.
- 각 입력 이미지를 차례로 픽셀화해 해당 파일명 기반의 개별 PNG로 만들고, 브라우저에서 바로 열 수 있는 ZIP 하나로 내려받습니다. PNG는 이미 압축되어 있으므로 ZIP 내부에서는 추가 압축 없이 저장합니다.
- 이미지 원본 비율/투명도 처리와 색상 양자화는 기존 단일 이미지 가져오기와 같은 방식을 사용합니다. 맞춤 크기는 가로·세로 각각 16–512 범위이며, 한 번에 최대 200개를 처리할 수 있습니다.

좌표는 현재 격자의 정수 픽셀 위치입니다. 예를 들어 256×192 캔버스에서 x는 0–255, y는 0–191입니다. 지원 명령은 다음과 같습니다.

| `op` | 주요 필드 | 동작 |
| --- | --- | --- |
| `setPixel` | `x`, `y`, `color` | 픽셀 하나를 지정 |
| `fillRect` | `x`, `y`, `width`, `height`, `color` | 사각형 영역 채우기. 캔버스 밖은 잘림 |
| `drawLine` | `x1`, `y1`, `x2`, `y2`, `color` | 두 좌표를 잇는 선 |
| `fillPolygon` | `points: [[x,y], ...]`, `color` | 3–512개 꼭짓점으로 폴리곤 채우기 |
| `clear` | `color` (선택) | 전체 지우기. 기본색은 흰색 |

명령 문서는 최대 20,000개 명령을 받습니다. 설정을 먼저 적용하고 명령 전체를 검증한 다음 한 번에 그립니다. 검증에 실패하면 해당 JSON의 설정이나 그림을 일부만 적용하지 않습니다. 기존 형식과의 호환을 위해 명령 객체 배열만 담은 JSON도 실행할 수 있습니다. AI가 자연어로 요청을 처리하는 모델 API는 연결되어 있지 않습니다. AI는 이 문서 규격에 맞는 JSON을 생성하고 사용자가 스튜디오에 붙여넣어 실행하는 방식입니다.

## JavaScript API

페이지 로드 뒤 `window.pixelArtCanvas`에서 같은 캔버스를 조작합니다.

```js
pixelArtCanvas.resize(256, 192);
pixelArtCanvas.setPixel(64, 64, "#e28a5b");
pixelArtCanvas.fillRect(40, 40, 48, 48, "#273b3a");
pixelArtCanvas.drawLine(0, 0, 255, 191, "#819783");
pixelArtCanvas.fillPolygon([[64, 20], [100, 58], [28, 58]], "#819783");

pixelArtCanvas.applyCommands(commandDocument);
const project = pixelArtCanvas.exportProject();
const formatHelp = pixelArtCanvas.getJSONFormatHelp();
```

`width`와 `height` 속성은 현재 논리 격자 크기입니다. `getState()`는 현재 크기와 RGBA `Uint8ClampedArray`를 반환합니다. `replacePixels(rgbaBytes)`는 현재 격자와 정확히 같은 길이의 픽셀 배열을 적용합니다. `exportPNG()`는 격자 오버레이가 섞이지 않은 400×400 아트 캔버스 데이터 URL을, 상단 PNG 내보내기 버튼은 현재 논리 격자 크기의 PNG 파일을 만듭니다.

## 공통 스튜디오 UI 규칙

본 픽셀 스튜디오와 Pixel Motion Studio는 같은 라이트/다크 팔레트, 시스템 글꼴, 상단바와 패널 규칙, 입력/버튼 크기, 간격, 키보드 포커스 표시를 사용합니다. 캔버스 도구와 프레임/미리보기 배치는 각 앱 작업에 맞게 유지합니다. 프레임워크나 원격 UI 라이브러리는 사용하지 않습니다. 규칙과 복사본 동기화 방식은 [`STUDIO_UI_SYSTEM.md`](./STUDIO_UI_SYSTEM.md)에 있습니다.

## 파일 안내

- `index.html`: 화면 구조와 에디터 컨트롤
- `styles.css`: 라이트/다크 테마, 반응형 레이아웃, 에디터 시각 스타일
- `studio-ui.css`: Pixel Studio와 모션 스튜디오가 공유하는 로컬 디자인 토큰과 공통 컨트롤 스타일
- `STUDIO_UI_SYSTEM.md`: 두 스튜디오의 공통 UI/UX 규칙 및 복사본 동기화 안내
- `app.js`: 픽셀 상태, 캔버스 렌더링, 도구, 단일/일괄 이미지 변환 및 ZIP 내보내기, JSON/API, 저장/불러오기
- 픽셀아트 JSON, 원본 이미지, 미리보기 및 GIF 프레임은 `SubProjects/private-image-assets-saver/`에 종류별로 로컬 보관합니다. 이 폴더는 Git에서 제외됩니다. JSON 예제 가져오기와 GIF 제작 절차는 해당 폴더의 README를 참고하세요.
- `.gitignore`: 비공개 에셋 보관 폴더와 독립 서브프로젝트 제외 규칙
- `robots.txt`, `sitemap.xml`: 공개 사이트 검색 크롤링 정책과 대표 URL 목록
- `AGENTS.md`: 에이전트용 구조·규약·수정 지침
