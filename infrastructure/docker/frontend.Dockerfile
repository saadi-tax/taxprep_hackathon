FROM node:20-alpine

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY frontend/package.json frontend/pnpm-lock.yaml* frontend/tsconfig*.json frontend/vite.config.ts frontend/vitest.config.ts /app/
COPY frontend /app

RUN pnpm install --frozen-lockfile || pnpm install

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]

