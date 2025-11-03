```javascript
// PptxGenJS Node.js API Ref

// 1. Init
const pres = new PptxGenJS();

// 2. Config
pres.layout = "LAYOUT_16x9"; // LAYOUT_4x3, LAYOUT_16x10, LAYOUT_WIDE
pres.defineLayout({ name: "A4", width: 11.7, height: 8.3 });
pres.title = "Title";
pres.subject = "Subject";
pres.author = "Author";
pres.company = "Company";

// 3. Add slide
const slide = pres.addSlide();
// With master: pres.addSlide({masterName: "MASTER_NAME"})
// With section: pres.addSlide({sectionTitle: "Section"})

// 4. Add content

// Text
slide.addText("Text", {
  x: 1,
  y: 1,
  w: 5,
  fontSize: 18,
  color: "000000",
  fontFace: "Arial",
  bold: true,
  align: "center",
  lineSpacing: 20, // The units here are points rather than row count
});

// Multi-format text
slide.addText(
  [
    { text: "Red", options: { color: "FF0000", bold: true } },
    { text: " Normal", options: { color: "000000" } },
    { text: " Blue", options: { color: "0000FF", italic: true } },
  ],
  { x: 1, y: 2, fontSize: 16 }
);

// Shapes
slide.addShape(pres.ShapeType.rect, {
  x: 1,
  y: 1,
  w: 2,
  h: 1,
  fill: { color: "FF0000" },
});
slide.addShape(pres.ShapeType.ellipse, {
  x: 4,
  y: 1,
  w: 2,
  h: 2,
  fill: { color: "00FF00", transparency: 30 },
});
slide.addShape(pres.ShapeType.line, {
  x: 1,
  y: 3,
  w: 5,
  h: 0,
  line: { color: "0000FF", width: 3 },
});

// Image
slide.addImage({
  data: "image_base64", // or you can use the data_ref and double curly braces to embed existing image data like: data: "{{data_ref}}"
  // path: "image_path" // but you don't need to use the path attribute usually
  x: 1,
  y: 1,
  w: 4,
  h: "auto",
  hyperlink: { url: "https://example.com" },
  rotate: 45,
  transparency: 10,
});

// Table
const tableData = [
  [{ text: "Name", options: { bold: true } }, "Age", "City"],
  ["John", "25", "Beijing"],
  ["Jane", "30", "Shanghai"],
];
slide.addTable(tableData, {
  x: 1,
  y: 1,
  w: 6,
  border: { type: "solid", color: "000000", pt: 1 },
  fill: { color: "F5F5F5" },
  fontSize: 12,
  colW: [2, 1, 2],
  rowH: [0.5, 0.4, 0.4],
});

// Chart
slide.addChart(
  pres.ChartType.bar,
  [
    {
      name: "Series1",
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
    title: "Sales Chart",
  }
);

// 5. Master slide
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
        text: "Presentation Title",
      },
    },
  ],
});

// Enums: the properties are defined in the PptxGenJS instance, not the PptxGenJS class.
pres.AlignH.left;
pres.AlignH.center;
pres.AlignH.right;
pres.AlignH.justify;
pres.AlignV.top;
pres.AlignV.middle;
pres.AlignV.bottom;
pres.ShapeType.rect;
pres.ShapeType.roundRect;
pres.ShapeType.ellipse;
pres.ShapeType.line;
pres.ChartType.bar;
pres.ChartType.pie;
pres.ChartType.line;
pres.ChartType.area;
```
