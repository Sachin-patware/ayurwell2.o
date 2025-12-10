# 🚀 AyurWell Backend & Frontend Configuration Guide

## ✅ What Was Fixed

### Backend (Flask)
- ✅ Updated CORS configuration for production-ready deployment
- ✅ Simplified CORS setup to allow all origins with proper headers
- ✅ Ready for Azure App Service deployment

### Frontend (Next.js)
- ✅ Created environment-based configuration system
- ✅ Centralized API URL management
- ✅ Easy switching between development and production

---

## 🔧 Backend Setup

### Python Version Required
**Python 3.8 - 3.11** (recommended: Python 3.10)

> ⚠️ **Note**: Flask 2.1.3 works best with Python 3.8-3.11. Python 3.12+ may have compatibility issues.

### CORS Configuration
The backend now uses a simplified CORS setup that works for both development and production:

```python
CORS(app, 
     origins="*",
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     supports_credentials=True,
     expose_headers=["Content-Type", "Authorization"]
)
```

### Azure Deployment - IMPORTANT
When deploying to Azure App Service:

1. **Disable Azure CORS Settings**
   - Go to: Azure Portal → Your App Service → CORS
   - **Remove ALL entries** (leave it completely empty)
   - Do NOT add "*" or any other values
   - Let Flask handle CORS completely

2. **Verify Deployment**
   - Test your API: `https://ayurwell-fdahb4anaaabacfa.centralindia-01.azurewebsites.net/docs`
   - If using Flask, you may need to add a health check endpoint

---

## 🌐 Frontend Setup

### Environment Configuration

#### For Development (Local)
Create a file: `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### For Production (Azure)
Create a file: `frontend/.env.production` or update `.env.local`

```env
NEXT_PUBLIC_API_URL=https://ayurwell-fdahb4anaaabacfa.centralindia-01.azurewebsites.net/api
```

### How It Works
- All API calls now use `process.env.NEXT_PUBLIC_API_URL`
- Change the URL in **ONE place** (`.env.local` or `.env.production`)
- No need to modify code files

### Files Updated
1. `src/services/api.ts` - Main API service
2. `src/services/appointmentService.ts` - Appointment-specific API calls

---

## 📝 Quick Start Guide

### 1. Backend (Flask)
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
```

### 2. Frontend (Next.js)
```bash
cd frontend

# Create environment file
# Copy .env.example to .env.local
copy .env.example .env.local

# Install dependencies (if needed)
npm install

# Run development server
npm run dev
```

---

## 🔄 Switching Between Environments

### Development → Production

**Option 1: Using .env files**
```bash
# In frontend directory
# Rename or update .env.local
NEXT_PUBLIC_API_URL=https://ayurwell-fdahb4anaaabacfa.centralindia-01.azurewebsites.net/api
```

**Option 2: Using build-time environment**
```bash
# Build for production
npm run build

# The .env.production file will be used automatically
```

### Production → Development
```bash
# Update .env.local back to localhost
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🧪 Testing the Setup

### 1. Test Backend CORS
```bash
# From browser console or Postman
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password' })
})
```

### 2. Test Frontend API Connection
```bash
# Check the console in browser DevTools
# You should see API calls going to the correct URL
```

### 3. Verify Environment Variable
Add this temporarily to any component:
```typescript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

---

## 🐛 Troubleshooting

### CORS Errors
- ✅ Ensure Azure CORS settings are **completely empty**
- ✅ Restart your Flask backend after CORS changes
- ✅ Clear browser cache and cookies

### Environment Variables Not Working
- ✅ Restart Next.js dev server after changing `.env.local`
- ✅ Ensure variable name starts with `NEXT_PUBLIC_`
- ✅ Check for typos in variable names

### 404 Errors on API Calls
- ✅ Verify backend is running on the correct port
- ✅ Check that API routes are registered correctly
- ✅ Ensure the URL in `.env.local` matches your backend

---

## 📦 Deployment Checklist

### Backend (Azure App Service)
- [ ] Python version set to 3.10 in Azure
- [ ] Environment variables configured in Azure App Settings
- [ ] Azure CORS settings are **empty**
- [ ] Health check endpoint working (if required)

### Frontend (Vercel/Azure/etc.)
- [ ] `.env.production` file created with production API URL
- [ ] Build completes successfully
- [ ] Environment variables set in hosting platform
- [ ] Test API calls from production frontend

---

## 🎯 Summary

**Before**: Hardcoded URLs in multiple files, difficult to switch environments
**After**: Single environment variable, change in one place, works everywhere

**Backend CORS**: Simplified, production-ready, Azure-compatible
**Frontend Config**: Environment-based, flexible, maintainable

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables are loaded
3. Test backend API directly (Postman/curl)
4. Ensure Azure CORS is disabled
