FROM node:20.12.2-alpine

WORKDIR /app

# Copy package.json and yarn configuration
COPY package.json .yarnrc.yml yarn.lock ./

# Enable corepack to use the correct Yarn version from packageManager field
RUN corepack enable && corepack prepare

# Install dependencies
RUN yarn install --immutable

COPY . .

RUN yarn build

EXPOSE 3000
CMD ["yarn", "start"]
