FROM node:22-slim AS dev

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

WORKDIR /app

# The sharp override points at the local stub, so it must be present before install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY stubs ./stubs
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["pnpm", "dev", "-H", "0.0.0.0"]
