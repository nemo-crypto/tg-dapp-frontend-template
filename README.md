# Telegram Mini App + TON 前端模板

使用 Next.js 14.2.4、React、Telegram Apps SDK、Telegram UI、NextUI 与 TonConnect 的移动活动前端。页面包含首页、每日活动、游戏、历史、邀请、任务和排行榜。

## 功能与目录

| 模块 | 入口 | 说明 |
|---|---|---|
| 应用路由 | `src/app/` | 活动页面与共享布局 |
| 宿主与主题 | [Root.tsx](src/components/Root/Root.tsx) | Telegram SDK、主题、视口及UI Provider |
| 会话 | [useSession.ts](src/hooks/useSession.ts) | 读取Telegram启动数据、用户标识与邀请参数 |
| 开发模拟 | [useTelegramMock.ts](src/hooks/useTelegramMock.ts) | 普通浏览器中的Telegram环境模拟 |
| 业务请求 | `src/utils/fetch/` | 客户端请求、接口与会话适配 |
| 钱包元数据 | [tonconnect-manifest.json](public/tonconnect-manifest.json) | 应用名称、图标与站点信息 |

## 环境与运行

包管理器声明为pnpm 9.7.0，使用仓库pnpm-lock.yaml。未声明Node engines，需要结合锁定的Next版本确认运行环境。

```bash
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

默认开发端口3000。需要HTTPS开发模式时：

```bash
pnpm dev:https
```

HTTPS开发涉及本机证书环境，不能替代Telegram内真实启动参数验证。

```bash
pnpm build
pnpm start
pnpm lint
```

生产start依赖先完成build。当前没有独立测试脚本。

## 配置与真实业务依赖

[next.config.mjs](next.config.mjs) 将BUILD_ENV默认设置为test，真实地址和请求逻辑位于 `src/utils/fetch/`。首页包含登录与Token刷新相关逻辑，需要配套业务接口；本目录没有提供完整的登录和活动服务端。

本地Telegram mock只便于页面开发，不是服务端可接受的身份验证依据。真实接入需由后端核实Telegram原始启动数据，再管理业务会话。

部署时核对TonConnect manifest中的站点和图标、钱包网络、机器人Mini App入口及后端地址。Next配置使用 `@svgr/webpack`，但当前package.json未直接声明该依赖，构建环境需要先解决此配置与依赖缺口。

## 环境模板与Telegram运行模式

远程更新提供了 [.env.example](.env.example)，本地复制为.env.local后按实际业务配置；.env.local由Git忽略。

| 变量 | 作用 |
|---|---|
| NEXT_PUBLIC_API_URL | Next.js API代理使用的业务后端地址 |
| NEXT_PUBLIC_AES_KEY | 客户端encrypt辅助方法所需的十六进制参数 |
| NEXT_PUBLIC_SIG_KEY | 客户端signParams辅助方法使用的签名后缀 |
| NEXT_PUBLIC_TMA_URL | 邀请分享的Telegram Mini App入口 |
| NEXT_PUBLIC_SHARE_MSG | Telegram分享文案 |

这些NEXT_PUBLIC变量会进入浏览器代码，不能作为仅服务端可见的秘密；修改客户端构建期变量后需重新构建，取值应与后端和Mini App配置匹配。

开发模式启用Telegram mock以便普通浏览器预览，但不会提供可用业务后端。生产build/start不启用该mock，需要在Telegram中携带有效启动参数访问；直接从普通浏览器打开生产包可能在SDK初始化阶段失败。Telegram内验证还需配置客户端可访问的部署地址。

## 开发与验收

页面放在App Router中，公共界面放components，宿主交互封装在hooks和Root。验收分别覆盖浏览器开发模拟、Telegram真实客户端、业务登录、钱包连接、路由和错误状态。

本轮只做源码和配置核对，未安装依赖、连接机器人、验证远端后端或发起链上交易。原README所列动画、日期与轮播依赖仍可从package.json追踪，实际接入以代码为准。
