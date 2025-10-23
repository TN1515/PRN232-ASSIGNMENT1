#!/bin/bash
# Quick Deploy Script for Vercel Fix
# Run this after making all the changes

echo "🚀 Deploying Vercel Fix"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Build Frontend${NC}"
cd client
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${YELLOW}❌ Build failed${NC}"
    exit 1
fi
cd ..
echo ""

echo -e "${BLUE}Step 2: Commit Changes${NC}"
git add .
git commit -m "Fix: Vercel 'Dangerous Site' - CORS & API client improvements

- Enhanced CORS configuration in Program.cs
- Created centralized axios client (axiosClient.ts)
- Added diagnostics tools for debugging
- Updated all auth pages to use centralized client
- Fixed API URL detection for production
- All API calls now HTTPS in production"

echo -e "${GREEN}✅ Changes committed${NC}"
echo ""

echo -e "${BLUE}Step 3: Push to GitHub${NC}"
git push origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Push successful${NC}"
    echo -e "${YELLOW}Vercel and Render will auto-redeploy${NC}"
else
    echo -e "${YELLOW}❌ Push failed${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for Vercel to redeploy"
echo "2. Wait 2-3 minutes for Render to redeploy"
echo "3. Visit your Vercel URL"
echo "4. Open F12 Console and run: await apiDiagnostics()"
echo "5. You should see '✅ Backend is reachable!'"
echo ""
