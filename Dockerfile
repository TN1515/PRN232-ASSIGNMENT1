# Stage 1: Build the .NET backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-builder
WORKDIR /app

# Copy the project files
COPY ECommerceApp.API/ .

# Restore dependencies
RUN dotnet restore

# Build the project
RUN dotnet build -c Release

# Publish the project
RUN dotnet publish -c Release -o /app/published

# Stage 2: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY client/ .

# Build the React app
RUN npm run build

# Stage 3: Runtime - .NET backend with static frontend
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy published backend from builder
COPY --from=backend-builder /app/published .

# Copy built React frontend to wwwroot
COPY --from=frontend-builder /app/client/build ./wwwroot

# Expose port 5000
EXPOSE 5000

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the backend application
ENTRYPOINT ["dotnet", "ECommerceApp.API.dll"]
