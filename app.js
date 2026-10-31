(() => {
  'use strict';

  const GRID = 128;
  const DISPLAY = 400;
  const STORAGE_KEY = 'pixel-atelier-art-v1';
  const PALETTE_KEY = 'pixel-atelier-palette-v1';
  const colors = ['#273b3a','#819783','#c8d0b7','#e4b27b','#d8815a','#a94f4b','#f0d7ad','#f7f4e8','#566778','#8c7184','#d4a7a0','#373638','#92b6ad','#e9c84a','#b2bd8d','#ffffff'];
  const canvas = document.querySelector('#artCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const buffer = document.createElement('canvas');
  buffer.width = GRID; buffer.height = GRID;
  const bctx = buffer.getContext('2d', { alpha: false, willReadFrequently: true });
  const state = { color: '#273b3a', tool: 'pencil', grid: true, zoom: 1, pointerDown: false, start: null, last: null, before: null, history: [], future: [], drawing: false };
  let pixels = new Uint8ClampedArray(GRID * GRID * 4);
  const $ = (selector) => document.querySelector(selector);

  function hexToRgb(hex) {
    const clean = String(hex).replace('#', '');
    const expanded = clean.length === 3 ? clean.split('').map((x) => x + x).join('') : clean;
    if (!/^[0-9a-f]{6}$/i.test(expanded)) throw new Error(`유효하지 않은 색상: ${hex}`);
    return [parseInt(expanded.slice(0,2),16), parseInt(expanded.slice(2,4),16), parseInt(expanded.slice(4,6),16),255];
  }
  function indexOf(x,y) { return (y * GRID + x) * 4; }
  function validPoint(x,y) { return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < GRID && y < GRID; }
  function setRaw(x,y,color) { const i=indexOf(x,y), rgba=hexToRgb(color); pixels.set(rgba,i); }
  function getHex(x,y) { if (!validPoint(x,y)) return null; const i=indexOf(x,y); return `#${[pixels[i],pixels[i+1],pixels[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('')}`; }
  function render() {
    const image = new ImageData(new Uint8ClampedArray(pixels), GRID, GRID);
    bctx.putImageData(image,0,0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0,0,DISPLAY,DISPLAY);
    ctx.drawImage(buffer,0,0,DISPLAY,DISPLAY);
    if (state.grid) {
      ctx.save(); ctx.strokeStyle='rgba(31,48,43,.11)'; ctx.lineWidth=.35;
      for(let i=1;i<GRID;i++){const p=i*DISPLAY/GRID;ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,DISPLAY);ctx.stroke();ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(DISPLAY,p);ctx.stroke();}
      ctx.restore();
    }
  }
  function snapshot(){return new Uint8ClampedArray(pixels);}
  function commit(before){if(before && !equal(before,pixels)){state.history.push(before);if(state.history.length>50)state.history.shift();state.future=[];updateHistoryButtons();save();}}
  function equal(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}
  function updateHistoryButtons(){$('#undoButton').disabled=!state.history.length;$('#redoButton').disabled=!state.future.length;}
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(Array.from(pixels)));$('#saveStatus').textContent='자동 저장됨';}catch{$('#saveStatus').textContent='저장 공간 부족';}}
  function restore(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(Array.isArray(data)&&data.length===pixels.length)pixels=new Uint8ClampedArray(data);}catch{/* Start with a blank canvas if saved data is invalid. */}}
  function pointFromEvent(event){const rect=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(GRID-1,Math.floor((event.clientX-rect.left)/rect.width*GRID))),y:Math.max(0,Math.min(GRID-1,Math.floor((event.clientY-rect.top)/rect.height*GRID)))};}
  function plotLine(a,b,color){let x=a.x,y=a.y,dx=Math.abs(b.x-a.x),sx=a.x<b.x?1:-1,dy=-Math.abs(b.y-a.y),sy=a.y<b.y?1:-1,err=dx+dy;while(true){setRaw(x,y,color);if(x===b.x&&y===b.y)break;const e2=2*err;if(e2>=dy){err+=dy;x+=sx;}if(e2<=dx){err+=dx;y+=sy;}}}
  function outlineRect(a,b,color){for(let x=Math.min(a.x,b.x);x<=Math.max(a.x,b.x);x++){setRaw(x,a.y,color);setRaw(x,b.y,color);}for(let y=Math.min(a.y,b.y);y<=Math.max(a.y,b.y);y++){setRaw(a.x,y,color);setRaw(b.x,y,color);}}
  function paintAt(p){if(!validPoint(p.x,p.y))return;if(state.tool==='pencil')setRaw(p.x,p.y,state.color);else if(state.tool==='eraser')setRaw(p.x,p.y,'#ffffff');else if(state.tool==='eyedropper'){state.color=getHex(p.x,p.y);updateColorUi();}else if(state.tool==='fill')floodFill(p.x,p.y,state.color);}
  function floodFill(x,y,color){const old=getHex(x,y);if(old===color)return;const stack=[[x,y]];setRaw(x,y,color);while(stack.length){const [cx,cy]=stack.pop();for(const [nx,ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]])if(validPoint(nx,ny)&&getHex(nx,ny)===old){setRaw(nx,ny,color);stack.push([nx,ny]);}}}
  function updateColorUi(){$('#colorPicker').value=state.color;$('#colorPreview').style.background=state.color;$('#colorHex').textContent=state.color.toUpperCase();document.querySelectorAll('.swatch').forEach(el=>el.classList.toggle('selected',el.dataset.color.toLowerCase()===state.color.toLowerCase()));}
  function renderPalette(){let saved;try{saved=JSON.parse(localStorage.getItem(PALETTE_KEY)||'null');}catch{}const palette=Array.isArray(saved)&&saved.every(c=>/^#[0-9a-f]{6}$/i.test(c))?saved:colors;const root=$('#palette');root.innerHTML='';palette.slice(0,24).forEach(color=>{const button=document.createElement('button');button.type='button';button.className='swatch';button.dataset.color=color;button.style.background=color;button.title=color;button.setAttribute('aria-label',`색상 ${color}`);button.addEventListener('click',()=>{state.color=color;updateColorUi();});root.append(button);});updateColorUi();}
  function showToast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2100);}
  function normalizeOp(op){if(!op||typeof op!=='object'||typeof op.op!=='string')throw new Error('각 명령에는 op 이름이 필요합니다.');const name=op.op;const color=op.color??state.color;hexToRgb(color);const integer=(v,k)=>{if(!Number.isInteger(v))throw new Error(`${k}는 정수여야 합니다.`);return v;};const coordinate=(v,k)=>{const n=integer(v,k);if(n<0||n>=GRID)throw new Error(`${k} 좌표는 0부터 ${GRID-1} 사이여야 합니다.`);return n;};if(name==='setPixel')return {op:name,x:coordinate(op.x,'x'),y:coordinate(op.y,'y'),color};if(name==='fillRect'){const width=integer(op.width,'width'),height=integer(op.height,'height');if(width<1||height<1)throw new Error('사각형의 width와 height는 1 이상이어야 합니다.');return {op:name,x:integer(op.x,'x'),y:integer(op.y,'y'),width,height,color};}if(name==='drawLine')return {op:name,x1:coordinate(op.x1,'x1'),y1:coordinate(op.y1,'y1'),x2:coordinate(op.x2,'x2'),y2:coordinate(op.y2,'y2'),color};if(name==='fillPolygon'){if(!Array.isArray(op.points)||op.points.length<3||op.points.length>512)throw new Error('fillPolygon은 점을 3개 이상, 512개 이하로 지정해야 합니다.');const points=op.points.map((p,i)=>{if(!Array.isArray(p)||p.length!==2)return (()=>{throw new Error(`points[${i}]는 [x, y] 형식이어야 합니다.`)})();return [coordinate(p[0],`points[${i}].x`),coordinate(p[1],`points[${i}].y`)];});return {op:name,points,color};}if(name==='clear')return {op:name,color:op.color??'#ffffff'};throw new Error(`지원하지 않는 op입니다: ${name}`);}
  function applyOperation(op){const c=op.color;if(op.op==='setPixel'){if(validPoint(op.x,op.y))setRaw(op.x,op.y,c);}else if(op.op==='fillRect'){const x0=Math.max(0,op.x),y0=Math.max(0,op.y),x1=Math.min(GRID,op.x+op.width),y1=Math.min(GRID,op.y+op.height);for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)setRaw(x,y,c);}else if(op.op==='drawLine')plotLine({x:op.x1,y:op.y1},{x:op.x2,y:op.y2},c);else if(op.op==='fillPolygon')fillPolygon(op.points,c);else if(op.op==='clear'){const rgba=hexToRgb(c);for(let i=0;i<pixels.length;i+=4)pixels.set(rgba,i);}}
  function fillPolygon(points,color){const minY=Math.max(0,Math.min(...points.map(p=>p[1]))),maxY=Math.min(GRID-1,Math.max(...points.map(p=>p[1])));for(let y=minY;y<=maxY;y++){const intersections=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi<=y&&yj>y)||(yj<=y&&yi>y))intersections.push((xj-xi)*(y-yi)/(yj-yi)+xi);}intersections.sort((a,b)=>a-b);for(let i=0;i<intersections.length;i+=2){const start=Math.max(0,Math.ceil(intersections[i])),end=Math.min(GRID-1,Math.floor(intersections[i+1]??intersections[i]));for(let x=start;x<=end;x++)setRaw(x,y,color);}}}
  function validateCommands(parsed){const list=Array.isArray(parsed)?parsed:[parsed];if(!list.length)throw new Error('실행할 명령이 없습니다.');if(list.length>1000)throw new Error('한 번에 실행할 수 있는 명령은 최대 1,000개입니다.');return list.map(normalizeOp);}
  function executeCommands(commands){const before=snapshot();commands.forEach(applyOperation);render();commit(before);}
  function getState(){return {width:GRID,height:GRID,displayWidth:DISPLAY,displayHeight:DISPLAY,format:'RGBA8',pixels:new Uint8ClampedArray(pixels)};}
  function getPixel(x,y){return getHex(x,y);}
  const api={version:'1.0',width:GRID,height:GRID,displayWidth:DISPLAY,displayHeight:DISPLAY,getPixel,setPixel(x,y,color){if(!validPoint(x,y))throw new RangeError('픽셀 좌표가 캔버스 범위를 벗어났습니다.');const before=snapshot();setRaw(x,y,color);render();commit(before);},fillRect(x,y,width,height,color){executeCommands(validateCommands({op:'fillRect',x,y,width,height,color}));},drawLine(x1,y1,x2,y2,color){executeCommands(validateCommands({op:'drawLine',x1,y1,x2,y2,color}));},fillPolygon(points,color){executeCommands(validateCommands({op:'fillPolygon',points,color}));},applyCommands(input){const parsed=typeof input==='string'?JSON.parse(input):input;const commands=validateCommands(parsed);executeCommands(commands);return {applied:commands.length,width:GRID,height:GRID};},getState,exportPNG(){return canvas.toDataURL('image/png');},getCommandsHelp(){return {operations:{setPixel:{x:'integer 0..127',y:'integer 0..127',color:'#RRGGBB'},fillRect:{x:'integer',y:'integer',width:'integer',height:'integer',color:'#RRGGBB'},drawLine:{x1:'integer',y1:'integer',x2:'integer',y2:'integer',color:'#RRGGBB'},fillPolygon:{points:'[[x,y], ...]',color:'#RRGGBB'},clear:{color:'#RRGGBB (optional)'}},example:[{op:'fillRect',x:40,y:40,width:48,height:48,color:'#e28a5b'},{op:'fillPolygon',points:[[64,20],[100,58],[28,58]],color:'#273b3a'}]};}};
  window.pixelArtCanvas=api;

  document.querySelectorAll('.tool-button').forEach(button=>button.addEventListener('click',()=>{state.tool=button.dataset.tool;document.querySelectorAll('.tool-button').forEach(b=>b.classList.toggle('active',b===button));canvas.style.cursor=state.tool==='eyedropper'?'copy':state.tool==='fill'?'cell':'crosshair';}));
  $('#colorPicker').addEventListener('input',e=>{state.color=e.target.value;updateColorUi();});
  $('#addColorButton').addEventListener('click',()=>{const list=[...document.querySelectorAll('.swatch')].map(el=>el.dataset.color);if(!list.includes(state.color.toLowerCase()))list.unshift(state.color.toLowerCase());try{localStorage.setItem(PALETTE_KEY,JSON.stringify(list.slice(0,24)));}catch{}renderPalette();showToast('색상을 팔레트에 추가했습니다.');});
  $('#gridToggle').addEventListener('change',e=>{state.grid=e.target.checked;render();});
  $('#zoomIn').addEventListener('click',()=>{state.zoom=Math.min(1.5,state.zoom+.1);$('#zoomLabel').textContent=`${Math.round(state.zoom*100)}%`;$('#canvasFrame').style.transform=`scale(${state.zoom})`;});
  $('#zoomOut').addEventListener('click',()=>{state.zoom=Math.max(.7,state.zoom-.1);$('#zoomLabel').textContent=`${Math.round(state.zoom*100)}%`;$('#canvasFrame').style.transform=`scale(${state.zoom})`;});
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=pointFromEvent(e);$('#cursorPosition').textContent=`X: ${p.x}   Y: ${p.y}`;if(state.tool==='eyedropper'){paintAt(p);return;}state.pointerDown=true;state.start=p;state.last=p;state.before=snapshot();if(state.tool==='pencil'||state.tool==='eraser'||state.tool==='fill')paintAt(p);state.drawing=true;render();});
  canvas.addEventListener('pointermove',e=>{const p=pointFromEvent(e);$('#cursorPosition').textContent=`X: ${p.x}   Y: ${p.y}`;if(!state.pointerDown)return;if(state.tool==='pencil'||state.tool==='eraser'){plotLine(state.last,p,state.tool==='eraser'?'#ffffff':state.color);state.last=p;}else if(state.tool==='line'||state.tool==='rect'){pixels.set(state.before);if(state.tool==='line')plotLine(state.start,p,state.color);else outlineRect(state.start,p,state.color);}render();});
  function endDraw(){if(!state.pointerDown)return;state.pointerDown=false;state.drawing=false;commit(state.before);state.before=null;}
  canvas.addEventListener('pointerup',endDraw);canvas.addEventListener('pointercancel',endDraw);canvas.addEventListener('pointerleave',e=>{if(!state.pointerDown)$('#cursorPosition').textContent='X: —   Y: —';});
  $('#undoButton').addEventListener('click',()=>{if(!state.history.length)return;state.future.push(snapshot());pixels=state.history.pop();render();save();updateHistoryButtons();});
  $('#redoButton').addEventListener('click',()=>{if(!state.future.length)return;state.history.push(snapshot());pixels=state.future.pop();render();save();updateHistoryButtons();});
  $('#clearButton').addEventListener('click',()=>{if(!confirm('캔버스를 모두 비울까요?'))return;const before=snapshot();const white=hexToRgb('#ffffff');for(let i=0;i<pixels.length;i+=4)pixels.set(white,i);render();commit(before);});
  $('#exportButton').addEventListener('click',()=>{const a=document.createElement('a');a.href=buffer.toDataURL('image/png');a.download='pixel-art-128x128.png';a.click();showToast('128 × 128 PNG를 저장했습니다.');});
  $('#downloadJsonButton').addEventListener('click',()=>{const rows=[];for(let y=0;y<GRID;y++){let run=null;for(let x=0;x<GRID;x++){const color=getHex(x,y);if(run&&run.color===color&&run.x+run.width===x)run.width++;else{if(run)rows.push({op:'fillRect',x:run.x,y,width:run.width,height:1,color:run.color});run={x,width:1,color};}}if(run)rows.push({op:'fillRect',x:run.x,y,width:run.width,height:1,color:run.color});}const blob=new Blob([JSON.stringify(rows,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pixel-art-commands.json';a.click();URL.revokeObjectURL(a.href);showToast(`${rows.length.toLocaleString()}개 색상 영역을 JSON으로 저장했습니다.`);});
  $('#exampleButton').addEventListener('click',()=>{$('#aiCommands').value=JSON.stringify([{op:'fillRect',x:40,y:40,width:48,height:48,color:'#e4b27b'},{op:'fillPolygon',points:[[64,20],[100,58],[28,58]],color:'#273b3a'},{op:'fillRect',x:58,y:55,width:12,height:12,color:'#d8815a'}],null,2);$('#aiCommands').focus();});
  $('#runAiButton').addEventListener('click',()=>{const message=$('#aiMessage');try{const parsed=JSON.parse($('#aiCommands').value);const commands=validateCommands(parsed);executeCommands(commands);message.textContent=`${commands.length}개 명령을 128 × 128 캔버스에 적용했습니다.`;message.className='ai-message success';}catch(error){message.textContent=error instanceof SyntaxError?'JSON 형식이 올바르지 않습니다. 괄호와 쉼표를 확인하세요.':error.message;message.className='ai-message error';}});
  document.addEventListener('keydown',e=>{const tag=document.activeElement?.tagName;if(tag==='TEXTAREA'||tag==='INPUT')return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();(e.shiftKey?$('#redoButton'):$('#undoButton')).click();return;}const keys={b:'pencil',e:'eraser',g:'fill',l:'line',r:'rect',i:'eyedropper'};if(keys[e.key.toLowerCase()])document.querySelector(`[data-tool="${keys[e.key.toLowerCase()]}"]`).click();});

  restore();renderPalette();render();updateHistoryButtons();
})();
