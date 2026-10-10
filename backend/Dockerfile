# ---- Backend (PRODUÇÃO): compila o TypeScript e roda o JavaScript ----
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
# Precisa das devDependencies (typescript) para compilar
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
# Apenas dependências de produção, respeitando o lockfile
RUN pnpm install --prod --frozen-lockfile

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Roda como usuário sem privilégios
USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]