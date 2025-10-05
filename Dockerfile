# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["ECommerceApp.API/ECommerceApp.API.csproj", "ECommerceApp.API/"]
RUN dotnet restore "ECommerceApp.API/ECommerceApp.API.csproj"

# Copy source code
COPY . .

# Build and publish the application
WORKDIR "/src/ECommerceApp.API"
RUN dotnet publish "ECommerceApp.API.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copy published application
COPY --from=build /app/publish .

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:80

# Expose port 80
EXPOSE 80

# Start the application
ENTRYPOINT ["dotnet", "ECommerceApp.API.dll"]
