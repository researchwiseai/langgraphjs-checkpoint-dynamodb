FROM oven/bun:1

WORKDIR /usr/src/app

COPY package.json bun.lockb ./

RUN bun install

COPY src ./src
COPY tests ./tests

CMD ["bun", "run", "test:integration"]
