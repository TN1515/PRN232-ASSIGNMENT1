# Smart API Configuration

Ứng dụng này sử dụng một file `.env` duy nhất để cấu hình cả môi trường local và production.

## Cấu hình trong `.env`:

```bash
PORT=3000
# API URLs for different environments
REACT_APP_API_URL_LOCAL=http://localhost:5000/api
REACT_APP_API_URL_PRODUCTION=https://prn232-assignment1-kcez.onrender.com/api
```

## Cách hoạt động:

### Local Development:
- Detect hostname: `localhost`
- Sử dụng: `REACT_APP_API_URL_LOCAL`
- API URL: `http://localhost:5000/api`

### Production (Vercel):
- Detect hostname: `*.vercel.app`
- Sử dụng: `REACT_APP_API_URL_PRODUCTION`  
- API URL: `https://prn232-assignment1-kcez.onrender.com/api`

## Commands:

```bash
# Development
npm start

# Build
npm run build

# Production test
npm install -g serve
serve -s build
```

## Debugging:
Console sẽ hiển thị:
- Environment
- Hostname  
- API Base URL được chọn