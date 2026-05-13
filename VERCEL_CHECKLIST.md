# Vercel Deployment Pre-Flight Checklist

## Code Readiness
- [ ] All code committed to Git
- [ ] No hardcoded secrets in code (check for API keys, passwords)
- [ ] Environment variables are using placeholders in `.env.example`
- [ ] Frontend build completes without errors: `cd frontend && npm run build`
- [ ] Backend runs without errors: `cd backend && npm start`
- [ ] No console errors in browser dev tools
- [ ] CORS is properly configured
- [ ] All dependencies listed in `package.json`
- [ ] No unused dependencies

## Backend Preparation
- [ ] Create/update `.env.example` with all required variables ✅
- [ ] `vercel.json` created in backend folder ✅
- [ ] `.gitignore` configured for backend ✅
- [ ] Server gracefully handles startup/shutdown
- [ ] MongoDB connection string validated
- [ ] JWT secret key is long and secure
- [ ] Rate limiting configured
- [ ] CORS whitelist updated for production
- [ ] File upload handling ready (or migrate to cloud storage)
- [ ] All API routes respond correctly
- [ ] Health check endpoint working: `/api/health`
- [ ] Error handling middleware is in place
- [ ] Logging configured for production

## Frontend Preparation
- [ ] Create/update `.env.example` with API URL ✅
- [ ] `vercel.json` created in frontend folder ✅
- [ ] Environment variable correct: `VITE_API_URL`
- [ ] API calls use environment variable instead of hardcoded URL
- [ ] Build configuration optimized in `vite.config.js` ✅
- [ ] No console errors or warnings
- [ ] Assets are optimized
- [ ] Images compressed
- [ ] No sensitive data in frontend
- [ ] SPA routing configured (vercel.json rewrites) ✅

## External Services
- [ ] MongoDB Atlas account setup
- [ ] MongoDB whitelist includes Vercel IP (0.0.0.0/0 or Vercel IPs)
- [ ] Razorpay account and keys obtained
- [ ] Groq API key obtained
- [ ] Email service configured (Gmail App Password or similar)
- [ ] API keys are strong and unique
- [ ] Consider migrating uploads to cloud storage (S3, Cloudinary, Vercel Blob)

## Vercel Setup
- [ ] Vercel account created
- [ ] GitHub account linked to Vercel
- [ ] Repository pushed to GitHub
- [ ] Two separate Vercel projects created (one for frontend, one for backend)

## Deployment Execution
- [ ] Backend deployed first
- [ ] Note backend deployment URL
- [ ] Update `FRONTEND_URL` in backend environment variables
- [ ] Frontend deployed with correct API URL
- [ ] Verify both are accessible

## Post-Deployment Testing
- [ ] Frontend loads successfully
- [ ] Health check API responds: `https://your-backend.vercel.app/api/health`
- [ ] Login page works
- [ ] User registration works
- [ ] API calls from frontend reach backend
- [ ] Database operations work correctly
- [ ] File uploads work (or redirect to cloud storage)
- [ ] Payment gateway integration works (test mode)
- [ ] Email notifications send correctly
- [ ] Chatbot functionality works
- [ ] All admin features functional
- [ ] All student features functional
- [ ] All teacher features functional
- [ ] Check browser console for errors
- [ ] Check Vercel deployment logs for errors
- [ ] Mobile responsiveness verified

## Security Verification
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CORS headers correct
- [ ] JWT tokens working
- [ ] No sensitive data in localStorage (besides token)
- [ ] Password hashing verified
- [ ] Rate limiting active
- [ ] Security headers in place (Helmet.js configured)

## Performance Verification
- [ ] Page load time acceptable
- [ ] API responses fast
- [ ] No unnecessary API calls
- [ ] Images optimized
- [ ] Bundle size reasonable
- [ ] Database queries efficient

## Monitoring Setup
- [ ] Vercel Analytics enabled
- [ ] Error tracking setup (optional: Sentry)
- [ ] Database monitoring enabled (MongoDB Atlas)
- [ ] Email alerts configured for errors

## Documentation
- [ ] DEPLOYMENT.md created ✅
- [ ] README.md updated with production URLs
- [ ] Environment variables documented
- [ ] Troubleshooting guide available
- [ ] Team members informed of deployment

## Final Checks
- [ ] Clean git history
- [ ] No merge conflicts
- [ ] Latest code tested locally
- [ ] Deployment URLs documented
- [ ] Team members have access
- [ ] Backup of database configuration
- [ ] Database backups enabled
- [ ] Automatic deployments configured (GitHub integration)

---

## Quick Deployment Summary

1. **Prepare**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Create Vercel Projects**
   - Frontend: Root directory = `frontend`
   - Backend: Root directory = `backend`

3. **Add Environment Variables** to both projects in Vercel

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Verify**
   - Test frontend URL
   - Test backend health check
   - Test full user flow

---

**Status**: ✅ Deployment-Ready Configuration Files Created

**Files Created/Updated**:
- ✅ `backend/vercel.json`
- ✅ `frontend/vercel.json`
- ✅ `backend/.env.example`
- ✅ `frontend/.env.example`
- ✅ `backend/.gitignore`
- ✅ `frontend/vite.config.js` (build optimization)
- ✅ `DEPLOYMENT.md` (comprehensive guide)

**Next Action**: Follow the deployment steps in `DEPLOYMENT.md`
