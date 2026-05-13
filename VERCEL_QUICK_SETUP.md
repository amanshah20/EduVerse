# Quick Vercel Setup Guide

## Step 1: Prepare Local Environment Files

Create `.env` files in your local environment for testing:

### Backend `.env` (git-ignored, for local dev only)
```
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key-min-32-characters
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
GROQ_API_KEY=your-groq-api-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
ADMIN_EMAIL=admin@eduplatform.com
ADMIN_PASSWORD=Admin@123456
```

### Frontend `.env.local` (git-ignored, for local dev only)
```
VITE_API_URL=http://localhost:5000/api
VITE_DEBUG=true
```

## Step 2: Prepare Vercel Environment Variables

You'll need these values for Vercel (go to Project Settings → Environment Variables):

### **Backend Project (Vercel)**
```
MONGO_URI = Your MongoDB Atlas connection string
JWT_SECRET = Generate: openssl rand -base64 32
FRONTEND_URL = https://your-frontend-domain.vercel.app
NODE_ENV = production
GROQ_API_KEY = Get from https://console.groq.com
RAZORPAY_KEY_ID = Get from Razorpay dashboard
RAZORPAY_KEY_SECRET = Get from Razorpay dashboard
EMAIL_USER = Your Gmail address
EMAIL_PASSWORD = Google App Password (enable 2FA first)
ADMIN_EMAIL = admin@yourdomain.com
ADMIN_PASSWORD = Generate strong password
```

### **Frontend Project (Vercel)**
```
VITE_API_URL = https://your-backend-domain.vercel.app/api
VITE_DEBUG = false
```

## Step 3: Services You Need to Set Up

### MongoDB Atlas
1. Create account: https://www.mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Create database user
4. Get connection string
5. **Important**: Add IP `0.0.0.0/0` to whitelist (or Vercel IPs)

### Razorpay (Payment Gateway)
1. Create account: https://razorpay.com
2. Get API keys from dashboard
3. Keep test keys for development, prod keys for production

### Groq API (Chatbot)
1. Create account: https://console.groq.com
2. Create API key
3. Keep it secret!

### Email Service
1. Use Gmail with App Password:
   - Enable 2-factor authentication
   - Create App Password
   - Use that as `EMAIL_PASSWORD`
2. Or use SendGrid, AWS SES, etc.

## Step 4: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)
1. Go to https://vercel.com
2. Click "New Project"
3. Select your GitHub repository
4. For **Frontend**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. For **Backend**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Leave Output Directory empty
6. Add all environment variables
7. Click Deploy

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
cd backend && vercel --prod
cd ../frontend && vercel --prod
```

## Step 5: Post-Deployment

### Update Your URLs
After deployment, update:
- Frontend `.env` → `VITE_API_URL=https://backend-url.vercel.app/api`
- Backend `.env` → `FRONTEND_URL=https://frontend-url.vercel.app`
- Redeploy both

### Test the Deployment
```bash
# Test health check
curl https://your-backend.vercel.app/api/health

# Test from browser console
fetch('https://your-backend.vercel.app/api/health').then(r => r.json()).then(d => console.log(d))
```

### Check Logs
```bash
vercel logs https://your-backend.vercel.app --follow
```

## Troubleshooting

### Issue: "Cannot GET /" on Backend
- Backend is serverless, not a traditional webpage
- Test with `/api/health` instead

### Issue: CORS Errors
- Check `FRONTEND_URL` is correct in backend env
- Redeploy backend after changing
- Check browser console for exact error

### Issue: MongoDB Connection Failed
- Verify `MONGO_URI` is correct
- Check MongoDB whitelist includes 0.0.0.0/0
- Check from Vercel logs: `vercel logs`

### Issue: Frontend Can't Reach Backend
- Verify `VITE_API_URL` is correct
- Check Network tab in DevTools
- Ensure CORS is enabled on backend
- Check backend is actually running

### Issue: Environment Variables Not Working
- Redeploy after adding env vars
- Check exact spelling (case-sensitive)
- No spaces around `=`
- Use correct environment (Production/Preview/Development)

## Useful Commands

```bash
# Pull env vars from Vercel
vercel env pull

# Check deployment status
vercel status

# Open deployment in browser
vercel --prod

# View all projects
vercel projects

# Clean build cache
vercel build --skip-build
```

## Important Security Notes

⚠️ **NEVER**:
- Commit `.env` files
- Share API keys in chat/email
- Use same keys for dev and production
- Commit secrets to git history

✅ **DO**:
- Use `.env.example` as template (no secrets)
- Rotate keys regularly
- Use strong, unique JWT secrets
- Enable MFA on all service accounts
- Use environment variables for everything
- Keep `.env` in `.gitignore`

## Need Help?

- Check Vercel logs: `vercel logs [url]`
- MongoDB Atlas docs: https://docs.atlas.mongodb.com/
- Razorpay docs: https://razorpay.com/docs/
- Groq docs: https://console.groq.com/docs
- Vercel docs: https://vercel.com/docs

---

**Current Status**: Ready for Deployment
**Created Files**: ✅ vercel.json, .env.example for both projects
