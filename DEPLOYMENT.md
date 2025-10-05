# Deployment Instructions

## Frontend (React) - Vercel
1. Connect GitHub repository to Vercel
2. Set root directory to `client`
3. Build command: `npm run build`
4. Output directory: `build`
5. Environment variables:
   - `REACT_APP_API_URL`: `https://prn232-assignment1-kcez.onrender.com/api`

## Backend (ASP.NET Core) - Render
- Already deployed at: https://prn232-assignment1-kcez.onrender.com
- CORS configured for Vercel domains

## API Endpoints
- Base URL: `https://prn232-assignment1-kcez.onrender.com/api`
- Products: `/products`
- Swagger UI: `/swagger`