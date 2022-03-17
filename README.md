# JangLuna's Electron Practice Repo

This `README.md` file will be a note for JangLuna's electron study.

## [1. Start settings](https://electronjs.org/docs/latest/tutorial/quick-start)

## 2. How works electron process

Electron has `multi-process arch` from Chromium.
This architecture is very similar to morden web browser.

### 왜 싱글 프로세서 구조가 아닌가요?

웹 브라우저는 일반으로 매우 복잡한 응용프로그램입니다. 기본기능인 웹 컨텐츠를 보여주는 것 이외에도 웹 브라우저는 서드파티 확장기능과 <span style="color : #FFA664">여러 탭(윈도우)를 관리</span>해야하는 보조 기능들이 존재합니다.

웹브라우저 초창기에는 브라우저가 일반적으로 `Single process` 로 모든 기능을 처리하였습니다. 하지만 이것은 <span style="color : #FFA664">한 웹사이트에서 생긴 문제</span>가 <span style="color : #FFA664">브라우저 전체에 영향</span>을 끼친다는 의미이기도 합니다.

### Multi-process model

이러한 문제를 해결하기 위해서 `Chorme`팀은 웹사이트의 악의적인 코드로 인한 버그나 위해를 제한하기 위해 <span style="color : #FFA664">각 탭마다 자체 프로세스로 탭을 랜더링</span> 하기로 결정했습니다.  
<span style="color : #FFA664">한 개의 메인 프로세스</span>가 <span style="color  : #DAF7A6">탭 프로세스들과 브라우저 자체 라이프 사이클</span>도 괸리합니다.

일렉트론 프로그램은 이것과 매우 유사합니다.
응용프로그램 개발자로써 당신은 `main-process`와 `render-process` 2개 타입의 프로세스를 괸리하게 됩니다.

이것들은 위에서 설명한 브라우저 메인 프로세스와 탭 프로세스와의 관계와 유사하다고 볼 수 있습니다.

## 3. Context Isolation

### What is `Context Isolation`?

`Context Isolation`이란, `webContents` 내에 웹사이트를 로드하기 위한 일렉트론 내부로직과 `preload` 스크립트가 서로 다른 실행 컨텍스트를 가짐을 보장하는 기능입니다.

웹사이트가 일렉트론 내부나 `preload` 스크립트의 API 등 중요 부분에 엑세스하는것을 방지하므로 보안적으로 매우 중요합니다.

이는 `preload` 스크립트가 액세스하는 객체가 실제 웹사이트에서 접근 가능한 객체와 다름을 의미합니다. 만약,

```js
// in preload script
window.hello = () => {
  console.log("hello");
};
```

```js
// in website script
window.hello(); // => undefined.
```

이런 `Context Isolation`는 앞으로 권장되는 사항입니다.

### 하지만 사용에 따라 언제나 예외는 존재한다.

일반적으로는 `Context Isolation` 을 준수하면서 개발해도 모든 작업이 안전하지는 않습니다. 만약 다음과 같이 코드를 사용한다면 <span style="color : #FB5735">안전하지 않습니다.</span>

```js
// In preload script..

// 어떤 종류의 파리미터 필터링 이나 제한 로직 없이 메서드를 직접제공 하는 것은 위험.
contextBridge.exposeInMainWorld("myAPI", {
  send: ipcRenderer.send,
});
```

`Typescript`를 사용하므로써 타입이나 전반적인 인터페이스를 보강할 수 있을 것입니다.

- [Link]('https://electron.js.org/doc/latest/tutorial/context-isolation')

## Inter Process Communication (IPC)

일렉트론에서의 프로세스모델에서 메인프로세스와 렌더러 프로세스의 책임이 다르므로 IPC 는 `UI 에서 네이티브 API를 호출`하거나, `네이티브 메뉴에서 웹 컨텐츠의 변경`을 트리거하는 것과 같은 많은 일반적 작업을 수행하는 유일한 방법입니다.

우리는 아래에서 몇 가지 IPC 패턴을 알아보겠습니다.

<hr/>

### Pattern 1 - 단방향 (Renderer -> Main)

<hr/>

### Pattern 2 - 양방향 (Renderer <-> Main)

이 패턴은 다음과 같이 진행되어 양방향으로 불림

> 1. 랜더러에서 요청 -> 메인에서 비동기 처리 (Renderer to Main)
> 2. 메인에서 비동기 처리한 결과값 리턴 -> 렌더러가 받음 (Main to Renderer)

골자만 빠르게 살펴보자.

**main.js**

```js

// 비동기 함수 선언
async function handleFileOpen() {
  const {canceled, filePaths} = awiat dialog.showOpenDialog()
  if( canceled ) {
    return
  } else {
    return filePath[0]
  }
}

// app.whenReady().then 내부에 선언하여 항상 ipc listen
app.whenReady().then({
  // 중략
  ipcMain.handle('dialog:openFile', handleFileOpen);
  // 후략
});
```

**preload.js**

```js
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile');
})

```

**renderer.js**

```js
btn.addEventListener("click", async () => {
  const filePath = await window.electronAPI.openFile();
  filePathElement.innerText = filePath;
});
```

<hr/>

### Pattern-3 - 단방향 (Main -> Renderer)
