
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./
COPY src ./src
COPY assets ./assets
COPY tsconfig.json ./

RUN npm install
RUN npm run compileAMP

#FROM node:22-alpine

#WORKDIR /app

#COPY --from=build /app/package*.json ./
#COPY --from=build /app/dist ./dist
#COPY --from=build /app/assets ./assets

#RUN npm install --only=production

CMD ["node", "dist/main.js"]