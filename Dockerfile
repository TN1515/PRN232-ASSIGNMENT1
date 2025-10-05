# Stage 1: Build React app
FROM node:18-alpine AS frontend-build
WORKDIR /app/client

# Install build essentials for native modules
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching
COPY ./client/package*.json ./

# Install dependencies with legacy peer deps for React 19 compatibility
RUN npm install --legacy-peer-deps --silent

# Copy source code
COPY ./client ./

# Set build environment variables
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV CI=false
ENV REACT_APP_API_URL=/api

# Build with increased memory and error handling
RUN NODE_OPTIONS="--max_old_space_size=4096 --openssl-legacy-provider" npm run build

# Stage 2: Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies (better caching)
COPY ["ECommerceApp.API/ECommerceApp.API.csproj", "ECommerceApp.API/"]
RUN dotnet restore "ECommerceApp.API/ECommerceApp.API.csproj"

# Copy source code and build
COPY . .
WORKDIR "/src/ECommerceApp.API"
RUN dotnet publish "ECommerceApp.API.csproj" -c Release -o /app/publish

# Stage 3: Final
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=frontend-build /app/client/build ./wwwroot
EXPOSE 80
ENTRYPOINT ["dotnet", "ECommerceApp.API.dll"]
