# Phantola's Electron Practice Repo

This `README.md` file will be a note for JangLuna's electron study.

## [1. Start settings](https://electronjs.org/docs/latest/tutorial/quick-start)

## 2. How works electron process

Electron has `multi-process arch` from Chromium.
This architecture is very similar to morden web browser.

### 왜 싱글 프로세서 구조가 아닌가?

웹 브라우저는 일반으로 매우 복잡한 응용프로그램이다. 기본 기능인 웹 컨텐츠를 보여주는 것 이외에도 웹 브라우저는 서드파티 확장기능과 <span style="color : #FFA664">여러 탭(윈도우)를 관리</span>해야하는 보조 기능들이 존재한다.

웹브라우저 초창기에는 브라우저가 일반적으로 `Single process` 로 모든 기능을 처리하였다.  
하지만 이것은 <span style="color : #FFA664">한 웹사이트에서 생긴 문제</span>가 <span style="color : #FFA664">브라우저 전체에 영향</span>을 끼친다는 문제가 있었다.

### Multi-process model

이러한 문제를 해결하기 위해서 `Chorme` 팀은 웹사이트의 악의적인 코드로 인한 버그나 위해를 제한하기 위해 <span style="color : #FFA664">각 탭마다 자체 프로세스로 탭을 랜더링</span> 하기로 결정했다.  
<span style="color : #FFA664">한 개의 메인 프로세스</span>가 <span style="color  : #DAF7A6">탭 프로세스들과 브라우저 자체 라이프 사이클</span>도 괸리하도록 한 것이다.

일렉트론 프로그램은 이것과 매우 유사하게 구현되어있다.
응용프로그램 개발자로써 우리는 `main-process`와 `render-process` 2개 타입의 프로세스를 괸리하게 될 것이다..

이것들은 위에서 설명한 브라우저 메인 프로세스와 탭 프로세스와의 관계와 유사하다고 볼 수 있다.

## 3. Context Isolation

### What is `Context Isolation`?

`Context Isolation`이란, `webContents` 내에 웹사이트를 로드하기 위한 일렉트론 내부로직과 `preload` 스크립트가 서로 다른 실행 컨텍스트를 가짐을 보장하는 기능이다.

웹사이트가 일렉트론 내부나 `preload` 스크립트의 API 등 중요 부분에 엑세스하는것을 방지하므로 보안적으로 매우 중요하다.

이는 `preload` 스크립트가 액세스하는 객체가 실제 웹사이트에서 접근 가능한 객체와 다름을 의미한다. 만약,

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

이런 `Context Isolation`는 앞으로 권장되는 사항이다.

### 하지만 사용에 따라 언제나 예외는 존재한다.

일반적으로는 `Context Isolation` 을 준수하면서 개발해도 모든 작업이 안전을 보장받는다고는 확언 할 수 없다. 만약 다음과 같이 코드를 사용한다면 <span style="color : #FB5735">안전하지 못한 코드</span>라고 할 수 있다.

```js
// In preload script..

// 어떤 종류의 파리미터 필터링 이나 제한 로직 없이 메서드를 직접제공 하는 것은 위험.
contextBridge.exposeInMainWorld("myAPI", {
  send: ipcRenderer.send,
});
```

`Typescript`를 사용하므로써 타입이나 전반적인 인터페이스를 보강할 수 있을 것으로 기대한다.

- [Link]('https://electron.js.org/doc/latest/tutorial/context-isolation')

## Inter-Process Communication (IPC)

일렉트론에서의 프로세스 모델에서 메인프로세스와 렌더러 프로세스의 역할이 다르므로 IPC 는 `UI 에서 네이티브 API를 호출`하거나, `네이티브 메뉴에서 웹 컨텐츠의 변경`을 트리거하는 것과 같은 많은 일반적 작업을 수행하는 유일한 방법이다.

우리는 아래에서 몇 가지 IPC 패턴을 알아본다.

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

우리는 일렉트론의 `Menu` 모듈을 이용해 볼 것이다.

`Menu` 모듈은 메인프로세스에서 타겟 렌더러 프로세스로의 IPC 메세지를 보내기 위해 `webContents.send` API 를 사용한다.

`Menu` 모듈을 사용하면 메뉴가 생성된다.

<br/>

**main.js**

```js
// in create window function
// ~

const menu = Menu.buildFromTemplate([
  {
    label: app.name,
    submenu: [
      {
        click: () => {
          win.webContents.send("update-counter", 1);
        },
        label: "Increment",
      },
      {
        click: () => {
          win.webContents.send("update-counter", -1);
        },
        label: "Decrement",
      },
      {
        label: `${app.name} 종료`,
        click: () => {
          app.quit();
        },
      },
    ],
  },
]);

Menu.setApplicationMenu(menu);

// ~
```

**preload.js**

```js
// renderer 에서는 DOM 이 로드되기 전에 updateCounter에 콜백을 전달하므로,
// window.addEventListener("DOMContentLoaded" ~ 아래에 넣으면
// renderer에서 updateCounter를 undefined로 처리함
contextBridge.exposeInMainWorld("preLoadedElectronAPI", {
  updateCounter: (callback) => ipcRenderer.on("update-counter", callback),
});
```

**renderer.js**

```js
window.preLoadedElectronAPI.updateCounter((event, value) => {
  const oldValue = Number(counter.innerText);
  const newValue = oldValue + value;

  counter.innerText = newValue;

  // event.reply 대신 event.sender.send
  event.sender.send("counter-value", newValue);
});
```

[공식 도큐먼트]('https://electronjs.org/latest/api/ipc-main')의 코드에서는 `renderer.js` 에서 `event.reply()` 를 사용하고 있지만,
실행해보니 `event.reply()`를 찾지 못한다는 에러(undefined) 가 나왔다.  
이것에 대한 해결법으로 Stack-Overflow 에서 `evnet.sender.send()` 를 대신 사용하라는 말이 있어, 공식 도큐먼트를 찾아보니 다음과 같은 글을 볼 수 있었다.

> sender에게 비동기적으로 메세지를 보낼 때, 당신은 `event.reply(...)` 을 사용 할 수 있습니다. 이 헬퍼 함수는 자동으로 메인 프레임이 아닌 프레임에서 오는 메세지를 처리합니다. 반면, `evnet.sender.send(...)` 는 언제나 메인프레임으로 보냅니다.

`event.reply(...)` 는 메인프레임이 아닌 곳들에서 온 ipc메세지에 대해 응답하는 것이고,
`evnet.sender.send(...)` 는 항상 메인프레임으로의 응답을 처리하는 메소드였다.

지금까지 우리는, 메인프레임에서 ipc메세지를 보냈고(`update-counter`), 따라서 `event.reply()` 로는 접근이 불가능 했던 것 같다.

> 이에 대한 추가 사항이 발견되면 이 문서를 항상 업데이트 하겠다.

<hr/>

## Pattern-4 (renderer -> renderer)

일렉트론 내에서 `ipcMain` 이나 `ipcRenderer` 를 이용한 직접적인 방법은 존재하지 않는다.
이 기능을 사용하기 위해 다음과 같은 2가지 옵션을 고려할 수 있겠다.

- 메인 프로세스를 두 랜더러 사이의 메세지 브로커로써 활용.
- 메인 프로세스에서 `MessagePort` 를 두 렌더러 모두에게 전달. 이렇게 하면 초기 설정 후 렌더러간 직접 통신이 가능.

</hr>

### `IPC Channel` 을 이용할 수 없는 객체들

일렉트론에서는 다음과 같이 설명하고 있다.

> IPC는 HTML 표준 Sturctured Clone Algorithm 을 사용하여 두 프로세스 간의 객체 전송 직렬화를 구현했습니다. 따라서 몇몇 객체 타입만이 IPC 채널을 통해 전송될 수 있습니다.

Sturctured Clone Algorithm 이란, 자바스크립트 객체 의 직렬화를 위해 정의된 알고리즘이다.
여기에는 재귀적인 복제를 막기위해서 해당 알고리즘에 의해 처리 될 수 있는 자료형들을 제시하고 있는데
[링크]('https://developer.mozilla.org/ko/docs/Web/API/Web_Workers_API/Structured_clone_algorithm') 를 살펴보면 알 수 있다.

따라서, 일렉트론에서는 다음과 같은 자료형은 IPC 를 사용할 수 없다고 한다.

- `DOM Object`
- `process.env` 와 같은 `C++`에 기반을 둔 `Node.js` 객체들
- `Electron` 객체들 (`WebContents`,`BrowserWindow`,`WebFrame` 등)
