```javascript
// 1. 创建演示文稿实例
let pres = new PptxGenJS();

// 2. 添加幻灯片
let slide = pres.addSlide();

// 3. 添加文本内容
slide.addText("Hello World!", {
  x: 1,
  y: 1,
  fontSize: 18,
  color: "363636",
});

// 4. 保存文件
pres.writeFile({ fileName: "MyPresentation.pptx" });
```

### TypeScript 示例

```typescript
import pptxgen from "pptxgenjs";

let pres = new pptxgen();
let slide = pres.addSlide();
slide.addText("TypeScript 示例", { x: 1, y: 1 });
pres.writeFile({ fileName: "TS-Example.pptx" });
```

## 核心概念

### 坐标系统

- 使用英寸(inch)作为单位
- 左上角为原点(0,0)
- 支持百分比定位（如 '50%'）

### 基本结构

```
Presentation (演示文稿)
    ├── Slide 1 (幻灯片)
    │   ├── Text (文本)
    │   ├── Shape (形状)
    │   ├── Image (图片)
    │   └── Table (表格)
    ├── Slide 2
    └── ...
```

## 演示文稿配置

### 基本配置

```javascript
let pres = new PptxGenJS();

// 设置布局 (页面尺寸)
pres.layout = "LAYOUT_16x9"; // 16:9宽屏
// 或: "LAYOUT_4x3", "LAYOUT_16x10", "LAYOUT_WIDE"

// 自定义布局
pres.defineLayout({
  name: "A4",
  width: 11.7,
  height: 8.3,
});

// 元数据
pres.title = "演示文稿标题";
pres.subject = "主题描述";
pres.author = "作者名称";
pres.company = "公司名称";
pres.revision = "1"; // 必须为整数
```

### 主题配置

```javascript
pres.theme = {
  headFontFace: "Arial", // 标题字体
  bodyFontFace: "Calibri", // 正文字体
};
```

## 幻灯片操作

### 添加幻灯片

```javascript
// 基础幻灯片
let slide1 = pres.addSlide();

// 使用母版
let slide2 = pres.addSlide({
  masterName: "MASTER_SLIDE_NAME",
});

// 添加到指定节
let slide3 = pres.addSlide({
  sectionTitle: "章节名称",
});
```

### 幻灯片背景

```javascript
slide.background = {
  color: "FFFFFF", // 纯色背景
  transparency: 0, // 透明度 0-100
};

// 或图片背景
slide.background = {
  path: "path/to/image.jpg",
  transparency: 10,
};
```

## 添加内容

### 文本 (Text)

#### 基础文本

```javascript
slide.addText("基础文本", {
  x: 0.5,
  y: 0.5,
  w: 5,
  fontSize: 18,
  color: "000000",
  fontFace: "Arial",
  bold: true,
  italic: false,
  align: "center", // left, center, right, justify
  valign: "middle", // top, middle, bottom
});
```

#### 高级文本格式

```javascript
slide.addText("格式化文本", {
  x: 1,
  y: 1,
  fontSize: 14,
  color: "FF0000",

  // 边框
  border: {
    type: "solid",
    color: "000000",
    pt: 1,
  },

  // 填充
  fill: {
    color: "F0F0F0",
    transparency: 20,
  },

  // 阴影
  shadow: {
    type: "outer",
    color: "888888",
    blur: 5,
    offset: 3,
    angle: 45,
    opacity: 0.5,
  },

  // 超链接
  hyperlink: {
    url: "https://example.com",
    tooltip: "访问示例网站",
  },
});
```

#### 多格式文本

```javascript
slide.addText(
  [
    { text: "红色", options: { color: "FF0000", bold: true } },
    { text: " 普通", options: { color: "000000" } },
    { text: " 蓝色", options: { color: "0000FF", italic: true } },
  ],
  { x: 1, y: 2, fontSize: 16 }
);
```

### 形状 (Shapes)

#### 基础形状

```javascript
// 矩形
slide.addShape(pres.ShapeType.rect, {
  x: 1,
  y: 1,
  w: 2,
  h: 1,
  fill: { color: "FF0000" },
  line: { color: "000000", width: 2 },
});

// 圆形
slide.addShape(pres.ShapeType.ellipse, {
  x: 4,
  y: 1,
  w: 2,
  h: 2,
  fill: { color: "00FF00", transparency: 30 },
});

// 线条
slide.addShape(pres.ShapeType.line, {
  x: 1,
  y: 3,
  w: 5,
  h: 0,
  line: { color: "0000FF", width: 3, dashType: "dash" },
});
```

#### 带文本的形状

```javascript
slide.addText("圆角矩形", {
  shape: pres.ShapeType.roundRect,
  x: 1,
  y: 4,
  w: 3,
  h: 1,
  fill: { color: "FFFF00" },
  rectRadius: 0.2, // 圆角半径 0-1
  color: "000000",
  align: "center",
  valign: "middle",
});
```

### 图片 (Images)

```javascript
slide.addImage({
  path: "path/to/image.jpg", // 文件路径或URL
  // 或使用base64: data: "base64encodedstring",
  x: 1,
  y: 1,
  w: 4,
  h: 3,

  // 可选属性
  hyperlink: { url: "https://example.com" },
  rounding: false, // 圆角
  rotate: 45, // 旋转角度
  transparency: 10, // 透明度
  sizing: {
    type: "cover", // contain, cover, crop
    w: 4,
    h: 3,
  },
});
```

### 表格 (Tables)

#### 基础表格

```javascript
let tableData = [
  [{ text: "姓名", options: { bold: true } }, "年龄", "城市"],
  ["张三", "25", "北京"],
  ["李四", "30", "上海"],
  ["王五", "28", "广州"],
];

slide.addTable(tableData, {
  x: 1,
  y: 1,
  w: 6,
  border: { type: "solid", color: "000000", pt: 1 },
  fill: { color: "F5F5F5" },
  fontSize: 12,
});
```

#### 高级表格

```javascript
slide.addTable(tableData, {
  x: 1,
  y: 2,
  w: 6,

  // 列宽
  colW: [2, 1, 2],

  // 行高
  rowH: [0.5, 0.4, 0.4, 0.4],

  // 单元格样式
  border: { type: "solid", color: "666666", pt: 0.5 },

  // 自动分页
  autoPage: true,
  autoPageRepeatHeader: true,
  autoPageHeaderRows: 1,

  // 字体样式
  fontSize: 11,
  color: "333333",
});
```

#### 单元格个性化

```javascript
let complexTable = [
  [
    {
      text: "合并单元格",
      options: {
        colspan: 2,
        fill: { color: "E6E6FA" },
        bold: true,
        align: "center",
      },
    },
    { text: "隐藏", options: { rowspan: 2 } },
  ],
  ["单元格1", "单元格2"],
];
```

### 图表 (Charts)

#### 基础图表

```javascript
slide.addChart(
  pres.ChartType.bar,
  [
    {
      name: "系列1",
      labels: ["Q1", "Q2", "Q3", "Q4"],
      values: [120, 150, 180, 90],
    },
  ],
  {
    x: 1,
    y: 1,
    w: 6,
    h: 4,
    chartColors: ["FF6384", "36A2EB", "FFCE56"],
    showLegend: true,
    showTitle: true,
    title: "销售图表",
  }
);
```

#### 支持图表类型

```javascript
// 柱状图
pres.ChartType.bar;
pres.ChartType.bar3d;

// 饼图
pres.ChartType.pie;
pres.ChartType.doughnut;

// 线图
pres.ChartType.line;

// 散点图
pres.ChartType.scatter;

// 面积图
pres.ChartType.area;

// 雷达图
pres.ChartType.radar;

// 气泡图
pres.ChartType.bubble;
```

## 保存与导出

### 保存为文件

```javascript
// 基础保存
pres.writeFile({ fileName: "Presentation.pptx" });

// 带压缩（文件更小）
pres.writeFile({
  fileName: "Compressed.pptx",
  compression: true,
});

// 使用Promise
pres
  .writeFile({ fileName: "MyPres.pptx" })
  .then((fileName) => {
    console.log(`文件已生成: ${fileName}`);
  })
  .catch((err) => {
    console.error("生成失败:", err);
  });
```

### 其他输出格式

```javascript
// Base64
pres.write({ outputType: "base64" }).then((base64) => {
  console.log("Base64:", base64.substring(0, 100));
});

// ArrayBuffer
pres.write({ outputType: "arraybuffer" }).then((buffer) => {
  // 处理二进制数据
});

// Blob (浏览器)
pres.write({ outputType: "blob" }).then((blob) => {
  // 处理Blob对象
});
```

### Node.js 流式输出

```javascript
const express = require("express");
const app = express();

pres.stream().then((data) => {
  app.get("/download", (req, res) => {
    res.setHeader(
      "Content-disposition",
      "attachment;filename=presentation.pptx"
    );
    res.setHeader("Content-Length", data.length);
    res.end(Buffer.from(data, "binary"));
  });
});
```

## 高级功能

### 幻灯片母版

```javascript
pres.defineSlideMaster({
  title: "CUSTOM_MASTER",
  background: { color: "FFFFFF" },
  objects: [
    {
      placeholder: {
        options: {
          name: "header",
          type: "title",
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 1,
          align: "center",
          fontSize: 24,
        },
        text: "演示文稿标题",
      },
    },
    {
      text: {
        text: "页脚文本",
        options: {
          x: 0.5,
          y: 6.5,
          w: 9,
          h: 10,
          align: "center",
          fontSize: 10,
          color: "666666",
        },
      },
    },
  ],
});

// 使用母版
let slide = pres.addSlide({ masterName: "CUSTOM_MASTER" });
```

### 节 (Sections)

```javascript
pres.addSection({ title: "第一章", order: 1 });
pres.addSection({ title: "第二章", order: 2 });
```

### 占位符

```javascript
slide.addText("标题内容", {
  placeholder: "title", // 匹配母版中的占位符名称
});
```

### HTML 表格转换

```javascript
// 将HTML表格转换为PPT表格（自动分页）
pres.tableToSlides("htmlTableId", {
  masterSlideName: "MASTER_NAME",
  autoPage: true,
  autoPageRepeatHeader: true,
});
```

## API 参考

### 常用枚举

#### 注意事项

下面的 `pres` 必须为 `PptxGenJS` 的实例，在 `PptxGenJS` 类上不能访问。

#### 对齐方式

```javascript
pres.AlignH.left; // 左对齐
pres.AlignH.center; // 居中
pres.AlignH.right; // 右对齐
pres.AlignH.justify; // 两端对齐

pres.AlignV.top; // 顶部对齐
pres.AlignV.middle; // 垂直居中
pres.AlignV.bottom; // 底部对齐
```

#### 形状类型（常用）

```javascript
// 基础形状
pres.ShapeType.rect; // 矩形
pres.ShapeType.roundRect; // 圆角矩形
pres.ShapeType.ellipse; // 椭圆/圆形
pres.ShapeType.line; // 直线
pres.ShapeType.triangle; // 三角形

// 箭头
pres.ShapeType.leftArrow; // 左箭头
pres.ShapeType.rightArrow; // 右箭头
pres.ShapeType.upArrow; // 上箭头
pres.ShapeType.downArrow; // 下箭头

// 流程图元素
pres.ShapeType.flowChartProcess; // 流程
pres.ShapeType.flowChartDecision; // 决策
pres.ShapeType.flowChartTerminator; // 终止符
```

#### 颜色方案

```javascript
pres.SchemeColor.text1; // 文本1
pres.SchemeColor.text2; // 文本2
pres.SchemeColor.background1; // 背景1
pres.SchemeColor.background2; // 背景2
pres.SchemeColor.accent1; // 强调1
// ... accent2 到 accent6
```

### 常用接口

#### 位置属性 (PositionProps)

```typescript
interface PositionProps {
  x?: number | string; // 水平位置 (英寸或百分比)
  y?: number | string; // 垂直位置
  w?: number | string; // 宽度
  h?: number | string; // 高度
}
```

#### 文本基础属性 (TextBaseProps)

```typescript
interface TextBaseProps {
  align?: "left" | "center" | "right" | "justify";
  bold?: boolean;
  color?: string; // 颜色值 (hex)
  fontFace?: string; // 字体
  fontSize?: number; // 字号
  italic?: boolean;
  valign?: "top" | "middle" | "bottom";
  // ... 更多属性
}
```

#### 边框属性 (BorderProps)

```typescript
interface BorderProps {
  type?: "none" | "dash" | "solid";
  color?: string; // hex颜色
  pt?: number; // 边框宽度(点)
}
```

### 实用工具方法

#### 获取版本信息

```javascript
console.log(PptxGenJS.version); // 输出库版本
```

#### 设置 RTL 模式

```javascript
pres.rtlMode = true; // 启用从右到左文本
```

## 最佳实践

### 1. 错误处理

```javascript
try {
  pres
    .writeFile({ fileName: "output.pptx" })
    .then(() => console.log("成功"))
    .catch((err) => console.error("保存失败:", err));
} catch (error) {
  console.error("生成失败:", error);
}
```

### 2. 性能优化

```javascript
// 复用样式对象
const titleStyle = { fontSize: 24, bold: true, color: "000000" };
const bodyStyle = { fontSize: 14, color: "333333" };

slide.addText("标题", { ...titleStyle, x: 1, y: 1 });
slide.addText("正文", { ...bodyStyle, x: 1, y: 2 });
```

### 3. 批量操作

```javascript
// 批量添加幻灯片
const slidesData = [
  { title: "第一页", content: "内容1" },
  { title: "第二页", content: "内容2" },
  // ...
];

slidesData.forEach((data, index) => {
  let slide = pres.addSlide();
  slide.addText(data.title, { x: 1, y: 1, fontSize: 20, bold: true });
  slide.addText(data.content, { x: 1, y: 2, fontSize: 14 });
});
```

## 常见问题

### 1. 字体问题

- 确保使用的字体在目标系统上可用
- 考虑嵌入字体或使用通用字体族

### 2. 图片加载

- 使用绝对路径或完整的 URL
- 考虑使用 base64 编码避免路径问题
- 注意图片尺寸和分辨率

### 3. 浏览器兼容性

- 现代浏览器都支持
- 对于旧版浏览器，确保使用兼容的 JavaScript 特性

### 4. 文件大小

- 使用 `compression: true` 减小文件大小
- 优化图片尺寸和质量
- 避免不必要的复杂格式
