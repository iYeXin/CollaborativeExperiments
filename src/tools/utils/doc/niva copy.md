# Niva 框架开发参考

## 项目配置 (niva.json)

```json
{
  "name": "App-name", // 此处只能有英文、数字、连字符，必填
  "uuid": "uuid",
  "icon": "assets/icon.png",
  "meta": {
    "version": "1.0.0",
    "name": "产品名称",
    "copyright": "版权信息",
    "description": "应用描述",
    "companyName": "公司名称"
  },
  "window": {
    "title": "窗口标题",
    "icon": "assets/icon.png",
    "size": { "width": 800, "height": 600 },
    // 下面的属性都是可选的
    "resizable": true,
    "minimizable": true,
    "maximizable": true,
    "closable": true,
    "decorations": true,
    "alwaysOnTop": false,
    "menu": [
      {
        "label": "文件",
        "children": [
          { "type": "item", "id": 1, "label": "打开", "accelerator": "Ctrl+O" },
          { "type": "separator" },
          { "type": "native", "label": "Quit" }
        ]
      }
    ]
  },
  "tray": {
    // 可选
    "icon": "assets/icon.png",
    "title": "托盘标题",
    "tooltip": "托盘提示",
    "menu": [
      { "type": "item", "id": 100, "label": "显示窗口" },
      { "type": "item", "id": 101, "label": "退出" }
    ]
  },
  "shortcuts": [{ "accelerator": "Ctrl+Shift+I", "id": 1 }]
}
```

## 核心 API 参考

### 窗口管理

```javascript
// 打开新窗口
const windowId = await Niva.api.window.open({
  title: "新窗口",
  size: { width: 400, height: 300 },
  position: { x: 100, y: 100 },
});

// 关闭窗口
await Niva.api.window.close(windowId);

// 获取窗口列表
const windows = await Niva.api.window.list();
// 返回: [{id: number, title: string, visible: boolean}]
```

### 文件系统

```javascript
// 获取文件信息
const info = await Niva.api.fs.stat(path);
// 返回:{ isDir: boolean,  isFile: boolean,  isSymlink: boolean,  size: number,  modified: number,  accessed: number,  created: number }

// 检查文件或目录是否存在
const isExists = await Niva.api.fs.exists(path);

// 读取文件 - 文本
const textContent = await Niva.api.fs.read(path, "utf8");

// 读取文件 - 二进制(base64)
const binaryData = await Niva.api.fs.read(path, "base64");
// 返回: base64编码字符串

// 写入文件 - 文本
await Niva.api.fs.write(path, "内容", "utf8");

// 写入文件 - 二进制
await Niva.api.fs.write(path, base64String, "base64");

// 文件操作

// copy / move 操作的可选参数
const options = {
  overwrite: boolean,
  skipExist: boolean,
  bufferSize: number,
  copyInside: boolean,
  contentOnly: boolean,
  depth: number,
};

await Niva.api.fs.copy(source, dest, options);
await Niva.api.fs.move(source, dest, options);

await Niva.api.fs.remove(path);

// 目录操作
await Niva.api.fs.createDir(path);
await Niva.api.fs.createDirAll(path); // 递归创建完整目录

const files = await Niva.api.fs.readDir(path);
// 返回目录中的所有文件和子目录的名称 | string[]
const files = await Niva.api.fs.readDirAll(path);
// 读取指定目录（包括子目录）的内容，并返回目录中的所有文件的相对路径（相对于所提供的目录）。
```

### 网络请求

```javascript
// 文本请求
const response = await Niva.api.http.fetch({
  url: "https://api.example.com/data",
  method: "GET",
  headers: { Authorization: "Bearer token" },
  responseType: "text",
});
// 返回: {status: number, statusText: string, ok: boolean, headers: object, url: string, response: {body: string, bodyType: "text"}}

// 二进制请求
const binaryResponse = await Niva.api.http.fetch({
  url: "https://example.com/image.jpg",
  responseType: "binary",
});
// 返回: {..., response: {body: base64字符串, bodyType: "base64"}}

// 发送二进制数据
await Niva.api.http.fetch({
  url: "https://api.example.com/upload",
  method: "POST",
  bodyType: "binary",
  body: base64Data,
});
```

### 进程管理

```javascript
// 执行命令
const result = await Niva.api.process.exec("echo", ["hello"], {
  silent: true, // 静默执行
  detached: false, // 非分离模式
  current_dir: "./", // 工作目录
});
// 返回: {status: number|null, stdout: string, stderr: string}

// 获取环境信息
const pid = await Niva.api.process.pid();
const args = await Niva.api.process.args();
const env = await Niva.api.process.env();
```

### 系统对话框

```javascript
// 文件选择
const file = await Niva.api.dialog.pickFile(
  ["*.txt", "*.json"],
  "D:/downloads" // 初始路径，可选
); // 返回文件名或文件路径或 null
const files = await Niva.api.dialog.pickFiles(["*.png", "*.jpg"]); // 返回文件名或文件路径数组或 null
const dir = await Niva.api.dialog.pickDir(
  "D:/downloads" // 初始路径，可选
); // 返回目录路径或 null

// 保存文件
const savePath = await Niva.api.dialog.saveFile(
  ["*.txt"],
  "D:/downloads" // 初始路径，可选
); // 返回保存路径或 null

// 消息框
await Niva.api.dialog.showMessage("标题", "内容", "info");
```

### 剪切板

```javascript
// 读取剪切板
const text = await Niva.api.clipboard.read();
// 返回: string | null

// 写入剪切板
await Niva.api.clipboard.write("要复制的文本");
```

### 托盘图标

```javascript
// 创建托盘
const trayId = await Niva.api.tray.create({
  icon: "icon.png",
  tooltip: "系统托盘",
  menu: [
    { type: "item", id: 1, label: "选项1" },
    { type: "item", id: 2, label: "选项2" },
  ],
});

// 更新托盘
await Niva.api.tray.update(trayId, {
  icon: "new_icon.png",
  tooltip: "新提示",
});
```

### 全局快捷键

```javascript
// 注册快捷键
const shortcutId = await Niva.api.shortcut.register("Ctrl+Shift+A");

// 注销快捷键
await Niva.api.shortcut.unregister(shortcutId);
```

## 事件监听

```javascript
// 窗口事件
Niva.addEventListener("window.focused", (event, focused) => {});
Niva.addEventListener("window.closeRequested", (event) => {
  // 返回false阻止关闭
  return false;
});

// 菜单事件
Niva.addEventListener("menu.clicked", (event, menuId) => {
  switch (menuId) {
    case 1:
      /* 处理菜单1 */ break;
    case 2:
      /* 处理菜单2 */ break;
  }
});

// 托盘事件
Niva.addEventListener("tray.leftClicked", (event, trayId) => {});
Niva.addEventListener("tray.rightClicked", (event, trayId) => {});

// 快捷键事件
Niva.addEventListener("shortcut.emit", (event, shortcutId) => {});

// 文件拖拽
Niva.addEventListener("fileDrop.dropped", (event, { paths, position }) => {});
```

## 资源访问

```javascript
// 访问打包资源
const exists = await Niva.api.resource.exists("assets/data.json");
const content = await Niva.api.resource.read("config.txt", "utf8");
await Niva.api.resource.extract("data.db", "./local/data.db");
```

## 二进制数据处理

```javascript
// Base64编码解码
const base64Data = await Niva.api.fs.read("file.bin", "base64");
const binaryString = atob(base64Data); // 解码
const encodedData = btoa(binaryString); // 编码

// HTTP二进制传输
const binaryResponse = await Niva.api.http.fetch({
  url: "https://example.com/file",
  responseType: "binary",
});
const binaryData = binaryResponse.response.body; // base64字符串
```

此参考涵盖 Niva 框架核心功能，适用于 AI 辅助编码场景。
