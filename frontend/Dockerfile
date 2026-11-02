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


FROM dev AS build

# Inlined into the browser code, so it must be known at build time.
ARG NEXT_PUBLIC_CONTACT_EMAIL=""
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL

RUN pnpm build \
    && cp -r public .next/standalone/ \
    && cp -r .next/static .next/standalone/.next/


# Only the traced server files: no pnpm, no dev dependencies, no sources.
FROM node:22-alpine AS prod

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

WORKDIR /app

COPY --from=build --chown=node:node /app/.next/standalone ./

USER node

EXPOSE 3000
CMD ["node", "server.js"]
