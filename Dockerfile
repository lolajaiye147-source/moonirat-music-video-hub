# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/moonirat/package.json artifacts/moonirat/package.json
COPY lib ./lib
COPY artifacts/moonirat ./artifacts/moonirat

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/moonirat run typecheck
RUN --mount=type=secret,id=supabase_url \
    --mount=type=secret,id=supabase_publishable_key \
    export VITE_SUPABASE_URL="$(cat /run/secrets/supabase_url)" && \
    export VITE_SUPABASE_PUBLISHABLE_KEY="$(cat /run/secrets/supabase_publishable_key)" && \
    test -n "$VITE_SUPABASE_URL" && \
    test -n "$VITE_SUPABASE_PUBLISHABLE_KEY" && \
    pnpm --filter @workspace/moonirat run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV BASE_PATH=/

COPY --from=build /app/artifacts/moonirat/dist ./dist
RUN cd dist/server && npm install --omit=dev --ignore-scripts

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "--enable-source-maps", "dist/server/index.mjs"]