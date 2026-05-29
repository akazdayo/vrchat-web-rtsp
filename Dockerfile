FROM node:24-slim

RUN npm install -g bun

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["npx", "vite", "dev", "--port", "3000", "--host"]
