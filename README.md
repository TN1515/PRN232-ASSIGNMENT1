# E-Commerce Clothing Store

A full-stack web application for selling clothing products built with ASP.NET Core Web API backend and React TypeScript frontend.

## Features

### Backend (ASP.NET Core Web API)
- Complete CRUD operations for products
- PostgreSQL database integration with Entity Framework Core
- RESTful API endpoints
- User authentication and authorization with JWT
- Password reset functionality with token-based security
- Data validation and error handling
- Swagger API documentation
- CORS configuration for frontend integration

### Frontend (React TypeScript)
- Product listing homepage
- Product detail pages
- Create/Edit product forms
- Delete product functionality
- User registration and login
- Shopping cart functionality
- Checkout and order management
- Forgot Password / Reset Password flow
- Responsive design with CSS
- Type-safe development with TypeScript
- React Router for navigation

### Product Model
Each product includes:
- **Name** (string, required)
- **Description** (string, required) 
- **Price** (decimal, required)
- **Image** (URL, optional)
- **CreatedAt** (datetime)
- **UpdatedAt** (datetime)

## API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires authentication)
- `POST /api/auth/forgot-password` - Request password reset token
- `POST /api/auth/reset-password` - Reset password with token

### Cart & Orders
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/{id}` - Update cart item quantity
- `DELETE /api/cart/items/{id}` - Remove item from cart
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - Get user's orders

## Tech Stack

### Backend
- ASP.NET Core 8.0
- Entity Framework Core
- PostgreSQL
- Swagger/OpenAPI

### Frontend
- React 18
- TypeScript
- React Router
- Axios for API calls
- CSS for styling

### DevOps
- Docker & Docker Compose
- Multi-stage Docker builds

## Project Structure

```
QE180041_Ass1/
├── ECommerceApp.API/           # ASP.NET Core Web API
│   ├── Controllers/            # API controllers
│   ├── Data/                   # Database context
│   ├── Models/                 # Entity models
│   ├── Migrations/             # EF migrations
│   └── Program.cs              # Application entry point
├── client/                     # React frontend
│   ├── public/                 # Static assets
│   └── src/
│       ├── components/         # Reusable components
│       ├── pages/              # Page components
│       ├── services/           # API service layer
│       └── types/              # TypeScript interfaces
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Development environment
└── README.md                   # This file
```

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- Node.js (v18 or later)
- PostgreSQL (or Docker)
- Docker (optional, for containerized deployment)

### Development Setup

#### 1. Database Setup
**Option A: Using Docker**
```bash
docker run --name postgres-dev -e POSTGRES_DB=ecommercedb -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15-alpine
```

**Option B: Local PostgreSQL**
- Install PostgreSQL locally
- Create database: `ecommercedb`
- Update connection string in `appsettings.json`

#### 2. Backend Setup
```bash
cd ECommerceApp.API
dotnet restore
dotnet ef database update  # Apply migrations
dotnet run
```

The API will be available at:
- HTTP: `http://localhost:5070`
- HTTPS: `https://localhost:7070`
- Swagger UI: `https://localhost:7070/swagger`

#### 3. Frontend Setup
```bash
cd client
npm install
npm start
```

The React app will be available at: `http://localhost:3000`

### Docker Deployment

#### Using Docker Compose (Recommended)
```bash
# 1. Create environment file for Docker
cp .env.docker.example .env.docker
# Edit .env.docker with your secure passwords

# 2. Build and run all services
docker-compose --env-file .env.docker up --build

# Run in background
docker-compose --env-file .env.docker up -d --build

# Stop services
docker-compose down
```

This will start:
- PostgreSQL database on port 5432
- Combined API + Frontend on port 5000 (HTTP) and 5001 (HTTPS)

#### Manual Docker Build
```bash
# Build the image
docker build -t ecommerce-app .

# Run with external database
docker run -p 5000:80 -e ConnectionStrings__DefaultConnection="Host=your-db;Database=ecommercedb;Username=postgres;Password=password" ecommerce-app
```

## Environment Variables

### Backend (.NET)
- `ConnectionStrings__DefaultConnection`: PostgreSQL connection string
- `ASPNETCORE_ENVIRONMENT`: Development/Production

### Frontend (React)
- `REACT_APP_API_URL`: API base URL (default: https://localhost:7070/api)

## Database Migration

```bash
# Create new migration
cd ECommerceApp.API
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Remove last migration
dotnet ef migrations remove
```

## Production Deployment

### Render.com (Recommended)
1. Fork this repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure build settings:
   - Build Command: `docker build -t app .`
   - Start Command: `docker run -p $PORT:80 app`
5. Add environment variables:
   - `ConnectionStrings__DefaultConnection`: Your production database URL

### Vercel (Frontend only)
1. Deploy the API separately (Render, Railway, etc.)
2. Deploy frontend to Vercel:
   ```bash
   cd client
   npm run build
   # Deploy build folder to Vercel
   ```

### Heroku
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set ASPNETCORE_ENVIRONMENT=Production
git push heroku main
```

## Testing the API

### Using Swagger UI
1. Navigate to `https://localhost:7070/swagger`
2. Test all endpoints directly in the browser

### Using curl
```bash
# Get all products
curl https://localhost:7070/api/products

# Get single product
curl https://localhost:7070/api/products/1

# Create product
curl -X POST https://localhost:7070/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","description":"Test Description","price":29.99,"image":"https://example.com/image.jpg"}'

# Update product
curl -X PUT https://localhost:7070/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"id":1,"name":"Updated Product","description":"Updated Description","price":39.99,"image":"https://example.com/image.jpg"}'

# Delete product
curl -X DELETE https://localhost:7070/api/products/1
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check connection string in `appsettings.json`
   - Verify database exists

2. **CORS Issues**
   - Check CORS policy in `Program.cs`
   - Ensure frontend URL is allowed

3. **Frontend API Calls Fail**
   - Check `REACT_APP_API_URL` environment variable
   - Verify API is running and accessible

4. **Docker Build Issues**
   - Ensure Docker is running
   - Check Dockerfile syntax
   - Verify all required files are included

### Development Tips

1. **Hot Reload**
   - Backend: Use `dotnet watch run` for automatic restarts
   - Frontend: `npm start` provides hot reload by default

2. **Database Reset**
   ```bash
   cd ECommerceApp.API
   dotnet ef database drop -f
   dotnet ef database update
   ```

3. **Logging**
   - Check console output for errors
   - API logs are available in the terminal
   - Browser developer tools for frontend issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact [your-email@example.com]