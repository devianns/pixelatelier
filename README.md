# Pixel Atelier

설치 과정 없이 브라우저에서 실행하는 픽셀 아트 편집기입니다. 논리 캔버스의 가로·세로를 각각 16–512 픽셀로 설정할 수 있고, 표시 영역은 400 × 400입니다.

## 실행

`index.html`을 브라우저에서 열면 됩니다. 정적 파일로 배포할 때도 별도 빌드 과정이 필요하지 않습니다.

## 사람용 편집 기능

- 연필, 지우개, 채우기, 직선, 사각형, 스포이트 도구
- 색상 선택기와 편집 가능한 팔레트
- 격자 표시, 확대, 실행 취소/다시 실행
- 브라우저 로컬 자동 저장, PNG와 JSON 내보내기
- 이미지를 설정한 캔버스 크기로 축소하고 16/32/64색으로 변환해 불러오기
- 이미지 맞춤 방식 선택: 비율 유지(전체 담기), 비율 유지 후 자르기, 가로세로 늘리기

## AI 그리기 인터페이스

페이지가 로드되면 `window.pixelArtCanvas` API가 준비됩니다. AI 연동 코드 또는 콘솔에서 같은 캔버스 상태를 수정할 수 있습니다.

```js
pixelArtCanvas.setPixel(64, 64, "#e28a5b");
pixelArtCanvas.resize(256, 192); // 기존 그림을 새 크기에 맞춰 최근접 픽셀로 조정
pixelArtCanvas.fillRect(40, 40, 48, 48, "#e28a5b");
pixelArtCanvas.drawLine(0, 0, 127, 127, "#273b3a");
pixelArtCanvas.fillPolygon([[64, 20], [100, 58], [28, 58]], "#273b3a");
pixelArtCanvas.replacePixels(rgbaBytes); // 현재 캔버스 크기의 RGBA Uint8Array/Uint8ClampedArray

pixelArtCanvas.applyCommands([
  { op: "fillRect", x: 40, y: 40, width: 48, height: 48, color: "#e28a5b" },
  { op: "fillPolygon", points: [[64, 20], [100, 58], [28, 58]], color: "#273b3a" }
]);
```

지원 명령은 `setPixel`, `fillRect`, `drawLine`, `fillPolygon`, `clear`입니다. 우측 AI 스튜디오에 JSON 명령을 입력하거나 JSON 파일을 불러와 실행하면 됩니다. `angel-pixel-art.json`은 참고 이미지에서 영감을 받은 픽셀 아트 예시입니다. 이는 모델 연결 전에도 인터페이스를 시험할 수 있는 입력부입니다. 실제 자연어 AI 연결에는 이후 모델 API를 호출하는 백엔드가 필요하며, API 키를 브라우저 코드에 직접 넣으면 안 됩니다.

캔버스는 `resize(width, height)` 또는 도구 모음 입력으로 설정하며 각 축은 16–512 정수입니다. 크기를 바꾸면 기존 그림을 최근접 픽셀로 다시 맞추고, 실행 취소로 되돌릴 수 있습니다. 픽셀, 직선, 폴리곤의 좌표는 현재 캔버스 범위 안의 정수입니다. 예를 들어 192×128 캔버스의 x 좌표는 0–191, y 좌표는 0–127입니다. 사각형은 양의 정수 `width`/`height`를 받으며 캔버스 바깥으로 나간 부분은 잘립니다. `replacePixels(rgbaBytes)`는 현재 캔버스 크기의 RGBA 픽셀 배열을 한 번에 적용합니다. JSON 명령 입력은 최대 20,000개까지 받습니다. `getState()`는 `{width, height, displayWidth, displayHeight, format, pixels}`를 반환하고, `pixels`는 RGBA 순서의 `width × height × 4` 바이트 `Uint8ClampedArray`입니다. `getPixel(x, y)`는 해당 픽셀의 HEX 색상을 반환합니다.
