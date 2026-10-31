# Pixel Studio

브라우저에서 직접 그리거나, AI가 만든 JSON 명령을 실행해 픽셀 아트를 만드는 정적 웹앱입니다. 현재 프로젝트는 HTML, CSS, 순수 JavaScript로 구성되어 별도 패키지 설치나 빌드 과정이 없습니다.

다른 에이전트가 개발을 이어갈 때는 [AGENTS.md](./AGENTS.md)의 구조, 상태 모델, JSON 규격과 수정 지침을 먼저 확인하세요.

## 실행

`index.html`을 브라우저에서 엽니다. 작업 내용과 설정은 `localStorage`에 자동 저장됩니다. 저장된 작업은 같은 브라우저 프로필에서 다시 열 때 복원됩니다.

## 사이트 메타데이터

`index.html`에는 한국어 페이지 제목·설명, Open Graph 및 Twitter 공유 메타데이터, SVG favicon이 설정되어 있습니다. 실제 도메인이 아직 정해지지 않아 canonical URL, `og:url`, sitemap은 추가하지 않았습니다. 검색 엔진 수집은 기본 허용 상태이며, 검색 결과 노출은 이 정적 앱을 공개 URL에 배포한 뒤 가능합니다.

## 캔버스와 픽셀 밀도

화면에 표시하는 캔버스는 400×400입니다. 내부 픽셀 격자는 별도로 설정하며 각 축에 16–512 정수를 사용할 수 있습니다. 기본값은 128×128, 총 16,384픽셀입니다. 직사각형 격자는 표시 영역 가운데에서 비율을 유지해 그립니다.

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
- 색상 선택기, 사용자 팔레트, 격자 표시, 확대 보기
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

`width`와 `height` 속성은 현재 논리 격자 크기입니다. `getState()`는 현재 크기와 RGBA `Uint8ClampedArray`를 반환합니다. `replacePixels(rgbaBytes)`는 현재 격자와 정확히 같은 길이의 픽셀 배열을 적용합니다. `exportPNG()`는 400×400 화면 캔버스 데이터 URL을, 상단 PNG 내보내기 버튼은 현재 논리 격자 크기의 PNG 파일을 만듭니다.

## 파일 안내

- `index.html`: 화면 구조와 에디터 컨트롤
- `styles.css`: 라이트/다크 테마, 반응형 레이아웃, 에디터 시각 스타일
- `app.js`: 픽셀 상태, 캔버스 렌더링, 도구, JSON/API, 저장/불러오기
- `examples/`: 가져오기 가능한 픽셀아트 JSON 예제 (`angel-pixel-art.json`, `celestial-angel-chibi.json`, `celestial-angel-chibi-v2.json`, `pink-chibi-transparent.project.json`)
- `assets/source-images/`: 생성·가져오기 원본 PNG 경로. PNG는 `.gitignore` 규칙으로 Git에서 제외하고, 공유할 픽셀아트는 `examples/`의 JSON으로 보관
- `.gitignore`: 원본 PNG 제외 규칙
- `AGENTS.md`: 에이전트용 구조·규약·수정 지침
