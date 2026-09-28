# AI 助教答疑平台 · 个性化注册与登录页面

一个纯前端实现的账号入口页面集合，用于演示 HTML5 表单增强与约束校验能力。
页面不依赖任何第三方框架与构建工具，直接双击 HTML 文件或用本地静态服务器打开即可运行。

## 目录结构

```
ai-ta-platform/
├── index.html              登录页（品牌介绍 + 个性化登录表单）
├── register.html           注册页（账号信息 / 身份信息 / 个性化设置）
├── assets/
│   ├── css/style.css       统一视觉样式、深浅色主题变量、响应式布局
│   ├── js/theme.js         主题切换与本地记忆
│   ├── js/login.js         登录页交互与校验逻辑
│   ├── js/register.js      注册页交互、草稿保存与汇总
│   └── img/*.svg           徽标、示意图、默认头像（矢量，无位图依赖）
└── README.md
```

## 特色功能

| 模块 | 说明 |
| --- | --- |
| 个性化问候 | 根据访问时段生成问候语，并提示当日答疑记录状态 |
| 角色切换 | 学生 / 教师 / 助教三种身份，切换后账号字段规则、标签与提示自动变化 |
| 深浅色主题 | 基于 CSS 自定义属性实现，选择结果保存在 localStorage |
| 密码强度 | `<meter>` + `<output>` 实时给出强度分值与文字建议 |
| 用户名校验 | 输入即校验格式与占用情况，结果通过 `setCustomValidity` 反馈 |
| 草稿自动保存 | 表单内容防抖写入 localStorage，刷新页面后可恢复 |
| 头像预览 | `FileReader` 读取本地图片，无需上传即可预览 |
| 个性化设置 | 主题色实时作用于页面强调色，每周答疑目标用滑杆设置 |
| 响应式布局 | 窄屏下自动收起品牌介绍区，表单切换为单列 |

## 运行方式

直接打开 `index.html` 即可。若需要演示接口请求相关效果，可启动本地静态服务器：

```bash
python -m http.server 8080
```

然后访问 <http://localhost:8080/index.html>。

## 主要使用的 HTML5 能力

语义化结构（`header` / `main` / `aside` / `section` / `figure` / `fieldset` / `legend` / `details`）、
表单控件类型（`email`、`tel`、`url`、`number`、`time`、`range`、`color`、`file`、`search`）、
约束校验属性（`required`、`pattern`、`minlength`、`maxlength`、`min`、`max`、`step`、`multiple`、`novalidate`）、
输入辅助属性（`placeholder`、`autocomplete`、`inputmode`、`list` + `datalist`、`autofocus`、`spellcheck`）、
实时输出元素（`output`、`progress`、`meter`）以及 Constraint Validation API
（`checkValidity`、`validity`、`validationMessage`、`setCustomValidity`、
`:valid` / `:invalid` / `:user-valid` / `:user-invalid`）。
