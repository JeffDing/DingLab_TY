# DingLab气象研究中心综合信息服务平台 (DingLab_TY)

基于 React + Vite + TypeScript 重建的气象信息集成系统。

> 本项目部署在 GitHub Pages: https://jeffding.github.io/DingLab_TY/
> 仓库: https://github.com/JeffDing/DingLab_TY

## 技术栈

- React 18
- Vite 5
- TypeScript
- react-router-dom

## 功能特性

- 顶部 Header 显示标题和实时时间
- 左侧导航菜单（支持折叠/展开）
- 右侧 iframe 内容区域
- 本地页面和外部网站混合导航
- 外部链接在新标签页打开
- 管理员后台（导航管理）
- 密码修改功能

## 安装步骤

```bash
npm install
npm run dev
```

## 构建命令

```bash
npm run build
```

## 预览命令

```bash
npm run preview
```

## 部署到 GitHub Pages

```bash
# 一键部署：先构建 (predeploy) 再把 dist 推送到 gh-pages 分支
npm run deploy
```

`vite.config.ts` 中的 `base` 已设置为 `/DingLab_TY/`，与 gh-pages 子路径匹配。
`--nojekyll` 选项会在 gh-pages 分支添加 `.nojekyll` 文件，跳过 Jekyll 处理。