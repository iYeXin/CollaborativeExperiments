# Material Design 3 蓝色风格设计规范

## 1. 色彩系统 (Color System)

### 主色调 (Primary Colors)

- **主色 (Primary)**: `#005EEB` - 用于主要按钮、激活状态、重要元素
- **主色容器 (Primary Container)**: `#E5EFFD` - 用于次要按钮、容器背景
- **主色文字 (On Primary)**: `#FFFFFF` - 主色背景上的文字颜色

### 辅助色调 (Secondary Colors)

- **辅助色 (Secondary)**: `#5A6170` - 用于次要元素
- **辅助色容器 (Secondary Container)**: `#DFE2F9` - 次要容器背景
- **辅助色文字 (On Secondary)**: `#FFFFFF`

### 表面和背景 (Surface & Background)

- **表面色 (Surface)**: `#FBFBFF` - 卡片、面板背景
- **背景色 (Background)**: `#FBFBFF` - 页面背景
- **表面文字 (On Surface)**: `#333` - 主要内容文字

### 功能色彩 (Functional Colors)

- **错误色 (Error)**: `#BA1A1A` - 错误状态、警告
- **轮廓色 (Outline)**: `#757780` - 边框、分隔线

## 2. 高程和阴影 (Elevation & Shadows)

### 阴影层级

- **Elevation 1**: 轻微阴影，用于应用栏、卡片
- **Elevation 2**: 中等阴影，用于悬停状态
- **Elevation 3**: 较强阴影，用于模态框、对话框

```css
--md-elevation-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px rgba(0, 0, 0, 0.3);
--md-elevation-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px rgba(0, 0, 0, 0.3);
--md-elevation-3: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px rgba(0, 0, 0, 0.3);
```

## 3. 形状系统 (Shape System)

### 圆角规范

- **Extra Small**: `4px` - 小元素
- **Small**: `8px` - 按钮、输入框
- **Medium**: `12px` - 卡片、容器
- **Large**: `16px` - 大型容器
- **Extra Large**: `28px` - 圆形按钮、特殊形状

## 4. 动效和过渡 (Motion & Transitions)

### 动画参数

- **持续时间**: `0.3s`
- **缓动函数**: `cubic-bezier(0.2, 0, 0, 1)` - 自然流畅的动画曲线

## 5. 组件设计规范

### 应用栏 (App Bar)

- 使用表面色背景
- 主色文字
- Elevation 1 阴影
- 图标与文字间距: `12px`

### 文本字段 (Text Field)

- 浮动标签设计
- 聚焦状态边框变为主色
- 标签上移动画
- 支持文本和占位符

### 按钮系统 (Button System)

#### 填充按钮 (Filled Button)

- 主色背景，白色文字
- 大圆角 (`28px`)
- 阴影效果
- 悬停时阴影加深

#### 轮廓按钮 (Outlined Button)

- 透明背景，主色边框和文字
- 悬停时添加轻微背景色

#### 次要按钮 (Tonal Button)

- 辅助色容器背景
- 相应的文字颜色

### 选项卡 (Tabs)

- 底部激活指示条
- 激活状态使用主色
- 平滑的切换动画

### 表单元素

- 一致的边框和圆角
- 聚焦状态高亮
- 清晰的标签和说明文字

### 项目列表

- 悬停状态背景变化
- 渐进式显示操作按钮
- 图标和信息的合理布局

## 6. 响应式设计

### 断点设置

- **768px**: 中等屏幕适配
- **480px**: 小屏幕适配

### 响应式策略

- 弹性布局和 flex-wrap
- 字体大小调整
- 隐藏非必要元素
- 操作按钮始终可见

## 7. 交互反馈

### 状态指示

- 悬停状态: 轻微背景变化
- 激活状态: 颜色和阴影变化
- 禁用状态: 降低透明度

### 消息系统

- 成功、错误、信息三种类型
- 自动隐藏功能
- 平滑的出现和消失动画

## 8. 排版和间距

### 字体层次

- 标题: `1.3rem` (应用栏), `1.25rem` (模态框)
- 正文: `1rem`
- 辅助文字: `0.875rem`, `0.75rem`

### 间距系统

- 使用 `8px` 为基础单位
- 一致的 padding 和 margin
- 合理的元素间距

## 9. 图标使用

- Font Awesome 图标库
- 图标与文字组合使用
- 一致的图标大小和颜色
- 小屏幕下隐藏非必要图标
