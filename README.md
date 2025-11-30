# Pighub Mirror (猪猪图床镜像)

这是一个自托管的图片镜像网站，专门用于定期从 `pighub.top` 爬取并展示图片。项目采用前后端分离架构，支持 ARM 架构（如树莓派）的 Docker 容器化部署。

## 功能特性

- **自动爬虫**: 集成 APScheduler，定时从 Pighub API 获取最新图片数据。
- **本地存储**: 图片文件持久化存储在本地磁盘，数据库仅存储元数据。
- **公开图库**: 使用 React + Ant Design 实现的响应式瀑布流布局，支持分页浏览。
- **后台管理**: 密码保护的管理界面，可查看爬虫日志、手动触发爬取、删除图片。
- **容器化**: 提供 Docker 和 Docker Compose 配置，支持多阶段构建，一键部署。

## 技术栈

- **前端**: React 18, TypeScript, Vite, Ant Design, Axios
- **后端**: Python 3.11, FastAPI, SQLAlchemy, APScheduler
- **数据库**: SQLite
- **部署**: Docker (Multi-stage build)

## 快速开始 (Docker)

### 前置要求

- Docker
- Docker Compose
- **生产环境**: 域名（用于 HTTPS）

### 部署步骤

1. 克隆仓库或下载源码：
   ```bash
   git clone <your-repo-url>
   cd pighub
   ```

2. **配置域名（生产环境）**：
   - 编辑 `Caddyfile`，将 `your-domain.com` 替换为您的域名
   - 确保域名 DNS 已指向服务器 IP

3. 启动服务：
   ```bash
   docker-compose up -d --build
   ```

4. 访问应用：
   - **生产环境**: `https://your-domain.com` (自动 HTTPS)
   - **本地测试**: `http://localhost:8000`
   - **后台管理**: 访问 `/admin`
     - 默认账号: `admin`
     - 默认密码: `admin` (请在生产环境中修改)

> **注意**: 图片复制功能需要 HTTPS 环境。详见 [HTTPS_SETUP.md](HTTPS_SETUP.md)

## 开发指南

### 后端开发

1. 进入后端目录：
   ```bash
   cd backend
   ```
2. 创建虚拟环境并安装依赖：
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```
3. 启动开发服务器：
   ```bash
   uvicorn app.main:app --reload
   ```

### 前端开发

1. 进入前端目录：
   ```bash
   cd frontend
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 配置说明

- **环境变量**: 可以在 `.env` 文件中修改配置（如 `SECRET_KEY`）。
- **数据存储**: 
  - 数据库文件位于 `data/app.db`
  - 图片文件位于 `data/images/`
  - Docker 部署时，`data` 目录会挂载到容器中以保证数据持久化。

## 目录结构

```
/
├── backend/               # Python 后端代码
│   ├── app/
│   │   ├── main.py        # API 入口 & 静态文件服务
│   │   ├── crawler.py     # 爬虫逻辑
│   │   ├── models.py      # 数据库模型
│   │   └── ...
├── frontend/              # React 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   └── ...
├── data/                  # 数据存储目录 (Git 忽略)
├── Dockerfile             # 多阶段构建文件
└── docker-compose.yml     # 容器编排配置
```
