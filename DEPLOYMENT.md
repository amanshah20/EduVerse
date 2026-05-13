# EduPlatform Vercel Deployment Guide

## Prerequisites
- Vercel Account (https://vercel.com)
- GitHub repository (recommended for automatic deployments)
- Environment variables ready

---

## Environment Variables Setup

### Backend Environment Variables
Create these in Vercel Project Settings → Environment Variables

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eduplatform
JWT_SECRET=your-long-random-secret-key
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
GROQ_API_KEY=your-groq-api-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
ADMIN_EMAIL=admin@eduplatform.com
ADMIN_PASSWORD=Admin@123456
```

### Frontend Environment Variables
Create these in Vercel Project Settings → Environment Variables

```
VITE_API_URL=https://your-backend-url.vercel.app/api
VITE_DEBUG=false
```

---

## Deployment Steps

### Option 1: Deploy with GitHub (Recommended)

#### Frontend Deployment
1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Set Framework: **Next.js** (for Vite, keep as "Other")
6. Build Command: `npm run build`
7. Output Directory: `frontend/dist`
8. Add Environment Variables from Backend env setup
9. Click Deploy

#### Backend Deployment
1. In Vercel Dashboard, create a new project from same repo
2. Configure as follows:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Output Directory: Leave empty
   - Runtime: Node.js
3. Add Environment Variables
4. Click Deploy
5. Copy the deployment URL (e.g., https://backend.vercel.app)

### Option 2: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy Frontend
cd frontend
vercel --prod --env VITE_API_URL=https://your-backend-url.vercel.app/api

# Deploy Backend
cd ../backend
vercel --prod
```

---

## Configuration Files Included

### 1. `backend/vercel.json`
Configures serverless functions for the backend API

### 2. `frontend/vercel.json`
Configures static hosting for the frontend with SPA routing

### 3. `.env.example` files
Templates for environment variables in both frontend and backend

---

## Key Points

### Frontend
- Built with Vite → optimized static files
- Automatically handles SPA routing via `vercel.json`
- Environment variable: `VITE_API_URL` points to backend API
- Zero-downtime deployments on every push

### Backend
- Express.js server → Vercel serverless functions
- All environment variables from `.env` loaded
- MongoDB connection must be accessible from Vercel servers
- CORS configured to accept requests from frontend URL
- Rate limiting & security headers enabled

---

## Post-Deployment Checklist

- [ ] Update `FRONTEND_URL` in backend env with actual frontend URL
- [ ] Test API health check: `https://your-backend.vercel.app/api/health`
- [ ] Test CORS: Make request from frontend to backend
- [ ] Verify MongoDB connection working
- [ ] Check JWT token functionality (login/register)
- [ ] Test payment gateway (Razorpay) integration
- [ ] Verify email notifications sending
- [ ] Check file uploads working (multer)
- [ ] Test chatbot API (Groq)
- [ ] Monitor logs in Vercel dashboard

---

## Database & Static Files

### MongoDB Atlas
- Ensure IP whitelist includes Vercel IPs (0.0.0.0/0 for simplicity, or Vercel's IP ranges)
- Use connection string with credentials

### File Uploads
- Currently stored in `backend/uploads/`
- **For production**, migrate to cloud storage:
  - AWS S3
  - Google Cloud Storage
  - Vercel Blob Storage (recommended for Vercel)
  - Cloudinary

---

## Debugging

### Check Vercel Logs
```bash
vercel logs https://your-project.vercel.app --follow
```

### Common Issues

#### 1. CORS Errors
- Verify `FRONTEND_URL` env var matches actual frontend URL
- Check backend CORS configuration in `server.js`

#### 2. MongoDB Connection Failed
- Check `MONGO_URI` is correct
- Verify IP whitelist on MongoDB Atlas includes 0.0.0.0/0
- Check network connectivity from Vercel

#### 3. Static Files Not Serving
- Ensure `vite build` creates `dist/` folder
- Check `frontend/vercel.json` rewrites config

#### 4. Environment Variables Not Loading
- Redeploy after adding env vars
- Check spelling matches exactly
- Ensure no spaces around `=`

---

## Performance Optimization

### Frontend
- Vite build is already optimized
- Enable Vercel Analytics for monitoring
- Use Vercel Edge Caching

### Backend
- Use MongoDB indexes for frequently queried fields
- Implement caching strategies
- Monitor serverless function execution time
- Consider upgrading to larger MongoDB plan if needed

---

## Next Steps After Deployment

1. **Set up Custom Domain**
   - Add in Vercel Project Settings
   - Update API URLs to use custom domain

2. **Enable HTTPS** (automatic with Vercel)

3. **Set up Monitoring**
   - Vercel Analytics
   - Sentry for error tracking
   - MongoDB Atlas monitoring

4. **Implement CI/CD Pipeline**
   - Automatic testing on PR
   - Automated deployments on merge

5. **Scale Static Files**
   - Move uploads to cloud storage
   - Use CDN for better performance

---

## Troubleshooting Commands

```bash
# Check build locally
npm run build

# Preview production build
npm run preview

# Test environment variables
vercel env pull

# Check deployment status
vercel projects
```

---

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Express.js on Vercel: https://vercel.com/docs/concepts/nodejs/nodejs-runtime
- React/Vite on Vercel: https://vercel.com/docs/frameworks/vite
- MongoDB Atlas: https://docs.atlas.mongodb.com/

---

**Last Updated**: 2026-05-13
