# Stage 1: Build React app
FROM node:18-alpine AS frontend-build
WORKDIR /app/client
COPY ./client/package*.json ./
RUN npm install
COPY ./client ./
RUN NODE_OPTIONS="--max_old_space_size=512" npm run build

# Stage 2: Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ECommerceApp.API/ECommerceApp.API.csproj", "ECommerceApp.API/"]
RUN dotnet restore "ECommerceApp.API/ECommerceApp.API.csproj"
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
