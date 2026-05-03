# CCDA 项目说明

## 项目
/root/ccda-app/ — 唯一工作目录，所有修改都写在这里。

## 常用命令
- npm run build — 构建验证（每次修改后必须跑）
- npm run dev — 不要用，用 npm run build 代替
- git add -A && git commit -m "msg" && git push origin master:main — 提交推送

## 核心文件
- src/app/ — 所有页面
- src/lib/ — 核心引擎
- .env.local 中 DEEPSEEK_API_KEY 已配置

## 风格
- 主题色：琥珀/橙色系（#fef9f0, amber-400, orange-400），圆角卡片，白色背景
- 动画类：animate-fade-in, animate-bounce-in
- 语言：中文，面向海外华裔6-14岁儿童

## IMPORTANT 规则
- 每次改完任何文件都必须运行 npm run build 验证零错误
- 不要修改 .env.local
- 不要修改 .gitignore
- 不要使用 next dev
- 所有文件操作直接在本机文件系统进行
- git commit 信息用英文，feat/fix/chore 前缀
- 修改后必须 git push origin master:main
