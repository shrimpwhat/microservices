FROM oven/bun:1.2.11-slim

WORKDIR /app

COPY package.json .
COPY bun.lock .
RUN bun install

COPY . .
RUN bun run build

EXPOSE 3000

CMD ["bun", "start"]
