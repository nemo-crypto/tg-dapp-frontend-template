# Telegram-DAPP

## Local configuration

Use the pnpm version pinned in `package.json` (9.7.0).

Create `.env.local` in the project root and configure the features you intend to use:

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend request endpoint used by the Next.js API proxy. |
| `NEXT_PUBLIC_AES_KEY` | Hexadecimal key expected by the client-side `encrypt` helper. |
| `NEXT_PUBLIC_SIG_KEY` | Signing suffix expected by the client-side `signParams` helper. |
| `NEXT_PUBLIC_TMA_URL` | Telegram Mini App URL used by referral sharing. |
| `NEXT_PUBLIC_SHARE_MSG` | Text included in the Telegram share link. |

Use values compatible with your backend and Telegram app. `.env.local` is ignored by Git.
All `NEXT_PUBLIC_*` values are available to browser code; they are not server-only secrets.
Set them before building, and rebuild after changing values used by the client.

## Telegram and browser development

`pnpm run dev` enables the development-only Telegram environment mock, so the UI can
be opened in a regular browser. The mock does not supply a working backend.

Use `pnpm run dev:https` for the local HTTPS development server. To test inside
Telegram, configure your Mini App to open a reachable deployment URL.

`pnpm run build` followed by `pnpm run start` does not enable the Telegram mock.
Open the production build inside Telegram with valid launch parameters; opening
it directly in a regular browser can fail during Telegram SDK initialization.

## Install Dependencies
```bash
pnpm install
```

## Run

```bash
pnpm run dev
```

```bash
pnpm run build
pnpm run start
```

## NextUI 
```bash
@nextui-org/react
https://nextui.org/docs/guide/introduction
```

## Animate.css  【Basic initialization animation】
```bash
https://animate.style/
```

## dayjs 【Date formatting】
```bash
https://www.npmjs.com/package/dayjs
```

## react-id-swiper
```bash
https://react-id-swiper.ashernguyen.site/example/default
```
