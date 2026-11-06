
FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm_config_build_from_source=true npm ci

COPY . .

RUN mkdir -p database

EXPOSE 3000

CMD ["npm", "start"]
