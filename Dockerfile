# Stage 1: install production dependencies only
FROM node:24.14.1-alpine3.23 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Stage 2: production image
FROM node:24.14.1-alpine3.23 AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node src ./src

USER node

EXPOSE 8080

CMD ["node", "src/index.js"]
