FROM node:20 AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

ARG VITE_API_BASE_URL
ARG VITE_BUILD_TAG

# ---> Use the ARG when running the build command <---
# Prefix the build command with the env var assignment
RUN VITE_API_BASE_URL=${VITE_API_BASE_URL} VITE_BUILD_TAG=${VITE_BUILD_TAG} npm run build

# Production stage
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
