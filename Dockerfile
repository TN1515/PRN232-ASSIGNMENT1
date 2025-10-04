# Use multi-stage build
# Stage 1: Build the React app
FROM node:18-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the .NET API
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ECommerceApp.API/ECommerceApp.API.csproj", "ECommerceApp.API/"]
RUN dotnet restore "ECommerceApp.API/ECommerceApp.API.csproj"
COPY . .
WORKDIR "/src/ECommerceApp.API"
RUN dotnet build "ECommerceApp.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ECommerceApp.API.csproj" -c Release -o /app/publish

# Stage 3: Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=frontend-build /app/client/build ./wwwroot
ENTRYPOINT ["dotnet", "ECommerceApp.API.dll"]