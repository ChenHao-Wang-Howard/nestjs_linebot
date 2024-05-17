# 使用指定版本的Node.js作为基础镜像
FROM node:20.13.0

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装应用程序依赖
RUN yarn install

# 复制应用程序代码
COPY . .

# 构建NestJS应用
RUN yarn build

# 生成 Prisma 客户端
#RUN npx prisma migrate dev
RUN npx prisma generate

# 暴露应用程序端口
EXPOSE 3333

# 运行应用程序
CMD ["yarn", "start:dev"]