# 成昊的个人博客

基于 Astro + Notion + Vercel 构建。在 Notion 里写文章，网站自动更新。

## 本地开发

```bash
cp .env.example .env
# 编辑 .env，填入你的 NOTION_API_SECRET
npm install
npm run dev
```

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 在 Vercel 项目设置中添加环境变量:
   - NOTION_API_SECRET = 你的 Notion Integration 密钥
   - NOTION_DATABASE_ID = 31d4b9d75a5280d08adec654dc03f55a
4. 部署完成

## 发布新文章

1. 在 Notion 数据库中新建页面，写好内容
2. Status 设为 Published，填好 Date
3. 在 Vercel 项目页面点 Redeploy（或等自动构建）
