# Open-Source Headless eCommerce Platform

The repo contains Admin & Event Handler components. More details and Installation instructions: [Open-Source Headless eCommerce Platform](https://boundless-commerce.com/open-source)

## How to launch with Docker-Compose:

The repository provides 3 docker-images: 

- `kirillzh87/boundless-commerce-admin` - Admin
- `kirillzh87/boundless-commerce-admin-static` - Static Assets
- `kirillzh87/boundless-commerce-events-listener` - Events Handler

An example of `docker-compose.yml` - launch containers and follow the **installation instructions** (see below).

```
version: '3.6'
services:
  db:
    image: kirillzh87/boundless-commerce-db:latest
    environment:
      POSTGRES_PASSWORD: "${POSTGRES_PASSWORD}"
    healthcheck:
      test: pg_isready -U postgres
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis :
    image: redis:6
    healthcheck:
      test: redis-cli ping
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  rabbitmq:
    image: rabbitmq:3.9
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 15s
      timeout: 15s
      retries: 5
    restart: unless-stopped

  memcached:
    image: memcached:1-alpine
    healthcheck:
      test: nc -z localhost 11211
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  admin:
    image: kirillzh87/boundless-commerce-admin:latest
    ports:
      - "3000:3000"
    environment:
      INSTANCE_ID: 1
      STATIC_ASSETS_HOST: http://localhost:3001
      NODE_ENV: "${NODE_ENV}"
      DB_PASS: "${POSTGRES_PASSWORD}"
      DB_HOST: "${DB_HOST}"
      DB_SSL: "${DB_SSL}"
      RABBIT_MQ_HOST: "${RABBIT_MQ_HOST}"
      MEMCACHED_DSN: "${MEMCACHED_DSN}"
      REDIS_URL: "${REDIS_URL}"
      S3_KEY: "${S3_KEY}"
      S3_SECRET: "${S3_SECRET}"
      S3_BUCKET: "${S3_BUCKET}"
      S3_ENDPOINT: "https://${S3_ENDPOINT}"
      S3_REGION: "${S3_REGION}"
      S3_MEDIA_SERVER: "${S3_MEDIA_SERVER}"
      AWS_SES_KEY: "${AWS_SES_KEY}"
      AWS_SES_SECRET: "${AWS_SES_SECRET}"
      AWS_SES_REGION: "${AWS_SES_REGION}"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      memcached:
        condition: service_healthy
    restart: unless-stopped

  admin-static:
    image: kirillzh87/boundless-commerce-admin-static:latest
    ports:
      - "3001:80"
    restart: unless-stopped

  events-listener:
    image: kirillzh87/boundless-commerce-events-listener:latest
    environment:
      NODE_ENV: "${NODE_ENV}"
      DB_PASS: "${POSTGRES_PASSWORD}"      
      DB_HOST: "${DB_HOST}"
      DB_SSL: "${DB_SSL}"
      RABBIT_MQ_HOST: "${RABBIT_MQ_HOST}"
      MEMCACHED_DSN: "${MEMCACHED_DSN}"
      REDIS_URL: "${REDIS_URL}"
      S3_KEY: "${S3_KEY}"
      S3_SECRET: "${S3_SECRET}"
      S3_BUCKET: "${S3_BUCKET}"
      S3_ENDPOINT: "https://${S3_ENDPOINT}"
      S3_REGION: "${S3_REGION}"
      S3_MEDIA_SERVER: "${S3_MEDIA_SERVER}"
      AWS_SES_KEY: "${AWS_SES_KEY}"
      AWS_SES_SECRET: "${AWS_SES_SECRET}"
      AWS_SES_REGION: "${AWS_SES_REGION}"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      memcached:
        condition: service_healthy
    restart: unless-stopped

  s3-resizer:
    image: kirillzh87/boundless-s3-resizer:latest
    environment:
      NODE_ENV: "${NODE_ENV}"
      S3_KEY: "${S3_KEY}"
      S3_SECRET: "${S3_SECRET}"
      S3_BUCKET: "${S3_BUCKET}"
      S3_ENDPOINT: "https://${S3_ENDPOINT}"
      S3_REGION: "${S3_REGION}"
      USE_CACHE: true
    ports :
      - "3002:3000"

  api:
    image: kirillzh87/boundless-commerce-api-apache:latest
    environment:
      CACHE_TYPE: memcached
      CACHE_MEMCACHED_HOST: "${MEMCACHED_HOST}"
      CACHE_MEMCACHED_PORT: "${MEMCACHED_PORT}"
      # for SSL, add to DSN: ";sslmode=require"
      MANAGER_DB_DSN: "pgsql:host=${DB_HOST};port=5432;dbname=babylon_saas;user=postgres;password=${POSTGRES_PASSWORD}"
      INSTANCE_DB_HOST: "${DB_HOST}"
      #INSTANCE_DB_SSL: "required"
      RABBIT_HOST: "${RABBIT_MQ_HOST}"
      RABBIT_PORT: 5672
      RABBIT_USER: "${RABBIT_MQ_USER}"
      RABBIT_PASS: "${RABBIT_MQ_PASS}"
      S3_LOCATIONS_QTY: 1
      S3_LOCATIONS_DEFAULT: "${S3_BUCKET}"
      S3_LOCATION_1: "${S3_BUCKET}:${S3_ENDPOINT}:${S3_REGION}:5000:${S3_KEY}:${S3_SECRET}:"
    ports :
      - "3003:80"
    depends_on:
      db:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      memcached:
        condition: service_healthy
```

## Installing Store

After containers are up, connect to the `admin` container and run: `./shell.ts selfHosted install`

In most cases, the final command is: `docker exec -it boundless-admin-1 ./shell.ts selfHosted install`

Where `boundless-admin-1` is an ID of the container with the Admin. Run `docker ps` to see the list of running containers.


### ENV Variables:

`INSTANCE_ID` - the ID of instance. You can create multiple instances (shops) and switch between them by  specifeing INSTANCE_ID.

`STATIC_ASSETS_HOST` the URL of static assets server, use http://localhost:3001 for local run (see docker-compose config).

### For working with files you need to specify S3 Variables:

`S3_KEY` - key

`S3_SECRET` - secret

`S3_BUCKET` - bucket name, e.g. `boundless-space`

`S3_ENDPOINT` - S3 endpoint, e.g. `nyc3.digitaloceanspaces.com` (the `https` prefix is added in YML config, so should be specified without)

`S3_REGION` - e.g. `nyc3`

`S3_MEDIA_SERVER` - the https address of the on the fly resizer, for local run specify `http://localhost:3002`

### Send out Emails

Currently, the AWS SES only provider is supported:

`AWS_SES_KEY` - key

`AWS_SES_SECRET` - secret

`AWS_SES_REGION` - region

## How to launch locally (e.g. for development):

- Copy `.env.example` to `.env` and adjust (in most cases you need to replace hosts with `localhost`).
You also need to specify `VIEW_CACHE=false`, `STATIC_ASSETS_HOST=http://localhost:9001` (points to webpack),
`CSS_FILES=false`
- `yarn install`
- `yarn dev` - runs PM2 with the Express
- `yarn dev-webpack` - runs Webpack
- `yarn dev-event` - runs PM2 with events handler

