FROM node:18-alpine as main-node
RUN apk add --update --no-cache git python3 make g++ imagemagick
RUN npm i -g ts-node

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
COPY package.json yarn.lock ./
USER node
RUN yarn install

COPY --chown=node:node ./.webpack ./.webpack/
COPY --chown=node:node ./app ./app/
COPY --chown=node:node ./assets ./assets/
COPY --chown=node:node ./public ./public/
COPY --chown=node:node .env* config-sample.js eventServer.ts Gruntfile.js index.ts shell.ts tsconfig.json webpack.* ./
RUN chmod +x ./shell.ts
RUN yarn run build

CMD ["ts-node", "--transpile-only", "./index.ts"]

FROM main-node as event-server
CMD ["ts-node", "--transpile-only", "./eventServer.ts"]

FROM nginx:1.25-alpine as nginx-static
WORKDIR /var/www/html/
COPY ./.docker/nginx/static.conf /etc/nginx/conf.d/default.conf
COPY --from=main-node /home/node/app/public ./public/
