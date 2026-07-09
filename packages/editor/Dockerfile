# Build context is the repo root (needs the pnpm workspace root files).
FROM node:24-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl ca-certificates \
	&& rm -rf /var/lib/apt/lists/* \
	&& corepack enable \
	&& corepack prepare pnpm@latest --activate \
	&& curl -fsSL https://bun.sh/install | bash

ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/editor/package.json packages/editor/package.json
RUN pnpm install

COPY packages/editor packages/editor
WORKDIR /app/packages/editor

ENV FILES_ROOT=/data
EXPOSE 5173

CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]
