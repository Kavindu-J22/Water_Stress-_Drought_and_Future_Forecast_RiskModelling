FROM node:20-alpine

WORKDIR /app

COPY api/package*.json ./
RUN npm ci --only=production

COPY api/src ./src

ENV NODE_ENV=production
ENV PORT=8000
ENV ML_SERVICE_URL=http://ml-service:8001/internal/c3

EXPOSE 8000

CMD ["node", "src/app.js"]
