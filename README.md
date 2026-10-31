# Pixel Atelier

설치 과정 없이 브라우저에서 실행하는 128 × 128 픽셀 아트 편집기입니다. 캔버스는 화면에서 400 × 400으로 표시됩니다.

## 실행

`index.html`을 브라우저에서 열면 됩니다. 정적 파일로 배포할 때도 별도 빌드 과정이 필요하지 않습니다.

## 사람용 편집 기능

- 연필, 지우개, 채우기, 직선, 사각형, 스포이트 도구
- 색상 선택기와 편집 가능한 팔레트
- 격자 표시, 확대, 실행 취소/다시 실행
- 브라우저 로컬 자동 저장, PNG와 JSON 내보내기

## AI 그리기 인터페이스

페이지가 로드되면 `window.pixelArtCanvas` API가 준비됩니다. AI 연동 코드 또는 콘솔에서 같은 캔버스 상태를 수정할 수 있습니다.

```js
pixelArtCanvas.setPixel(64, 64, "#e28a5b");
pixelArtCanvas.fillRect(40, 40, 48, 48, "#e28a5b");
pixelArtCanvas.drawLine(0, 0, 127, 127, "#273b3a");
pixelArtCanvas.fillPolygon([[64, 20], [100, 58], [28, 58]], "#273b3a");

pixelArtCanvas.applyCommands([
  { op: "fillRect", x: 40, y: 40, width: 48, height: 48, color: "#e28a5b" },
  { op: "fillPolygon", points: [[64, 20], [100, 58], [28, 58]], color: "#273b3a" }
]);
```

지원 명령은 `setPixel`, `fillRect`, `drawLine`, `fillPolygon`, `clear`입니다. 우측 AI 스튜디오에 JSON 명령을 입력하거나 예시 명령을 불러와 실행하면 됩니다. 이는 모델 연결 전에도 인터페이스를 시험할 수 있는 입력부입니다. 실제 자연어 AI 연결에는 이후 모델 API를 호출하는 백엔드가 필요하며, API 키를 브라우저 코드에 직접 넣으면 안 됩니다.

좌표는 0–127 범위의 정수입니다. `getState()`는 `{width, height, displayWidth, displayHeight, format, pixels}`를 반환하고, `pixels`는 RGBA 순서의 65,536바이트 `Uint8ClampedArray`입니다. `getPixel(x, y)`는 해당 픽셀의 HEX 색상을 반환합니다.
