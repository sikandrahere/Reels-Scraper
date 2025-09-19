FROM mcr.microsoft.com/playwright:v1.55.0-noble

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production


COPY . .

RUN npx playwright install --with-deps || true

USER pwuser

EXPOSE 3000

CMD ["node", "index.js"]