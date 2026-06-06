<h3 align="center">komari-theme-Glassmorphism</h3>
<p align="center">
基于 Vue 3 + Vite + reka-ui + Tailwind CSS v4 的 Komari Monitor 毛玻璃主题
</p>

![preview](/docs/preview.png)

## 简介

komari-theme-Glassmorphism 是一个为 Komari Monitor 打造的玻璃风格主题，保留原有主题结构并加强卡片毛玻璃效果。此项目在原始 `Komari Emerald` 主题基础上进行了改造，优化了卡片样式、卡片大小、排版和可读性。

## 主要改动

- 全局卡片和节点卡片使用更强的玻璃毛玻璃效果
- 调整节点卡片尺寸和间距，增强可读性
- 保留原始作者 Tokinx 的设计贡献，并在此基础上扩展视觉风格

## 使用

1. 从当前仓库的 [Release 页面](https://github.com/sanrokamlan-prog/komari-theme-Glassmorphism/releases) 下载最新的 `komari-theme-Glassmorphism-build-*.zip` 文件
2. 登录 Komari Monitor 后，点击“设置”，进入“主题管理”选项卡
3. 点击“上传主题”，选择下载的 zip 文件
4. 刷新页面，即可应用主题

## 环境要求

- Node.js: `^20.19.0` 或 `>=22.12.0`
- Bun: `>=1.2.0`

## 开发

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 代码检查
bun run lint
```

## 构建

```bash
# 类型检查 + 生产构建
bun run build

# 预览生产构建
bun run preview
```

## 技术栈

| 类别     | 技术                             |
| -------- | -------------------------------- |
| 框架     | Vue 3                            |
| 构建工具 | Vite 7                           |
| UI 组件  | reka-ui（shadcn-vue 风格组件）   |
| 样式方案 | Tailwind CSS v4 + tw-animate-css |
| 状态管理 | Pinia 3                          |
| 路由     | Vue Router 5                     |
| 提示系统 | vue-sonner（Toaster）            |
| 图标     | @iconify/vue                     |
| 图表     | vue-echarts                      |
| 3D 地球  | cobe                             |
| 实用工具 | @vueuse/core, dayjs              |
| 代码规范 | ESLint (@antfu/eslint-config)    |

## 致谢

- 原始主题作者：Tokinx
- [Komari](https://github.com/komari-monitor/komari)
- [Komari Naive](https://github.com/tonyliuzj/komari-naive)
- [Vue 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [reka-ui](https://reka-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

本项目在原有 `Komari Emerald` 主题基础上进行了毛玻璃风格改造，特此感谢原作者 Tokinx 的贡献。

## License

[MIT](./LICENSE)
