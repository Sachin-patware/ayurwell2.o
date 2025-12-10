# 🎯 Quick Reference - AyurWell Configuration

## 📋 Python Version
**Use: Python 3.8 - 3.11** (Recommended: **Python 3.10**)

Check your version:
```bash
python --version
```

---

## 🔄 Environment Switching

### Currently Active: DEVELOPMENT
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### Switch to PRODUCTION
1. Update `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://ayurwell-fdahb4anaaabacfa.centralindia-01.azurewebsites.net/api
   ```
2. Restart Next.js dev server

---

## 🚀 Start Development

### Backend
```bash
cd backend
python app.py
```

### Frontend
```bash
cd frontend
npm run dev
```

---

## ✅ What Changed

### Backend (`app.py`)
- ✅ CORS simplified for production
- ✅ Works with Azure App Service
- ✅ No code changes needed for deployment

### Frontend
- ✅ `src/services/api.ts` - Uses environment variable
- ✅ `src/services/appointmentService.ts` - Uses environment variable
- ✅ `.env.local` - Development config (created)
- ✅ `.env.production` - Production config (created)
- ✅ `.env.example` - Template with instructions

---

## 🔧 Azure Deployment

### Backend CORS Settings
**IMPORTANT**: Go to Azure Portal → App Service → CORS
- **Remove ALL entries**
- Leave it **completely empty**
- Flask handles CORS

### Test Backend
```
https://ayurwell-fdahb4anaaabacfa.centralindia-01.azurewebsites.net/api/auth/login
```

---

## 📝 Files Created/Modified

### Created
- ✅ `DEPLOYMENT_GUIDE.md` - Full documentation
- ✅ `frontend/.env.local` - Development config
- ✅ `frontend/.env.production` - Production config
- ✅ `frontend/.env.example` - Template
- ✅ `QUICK_REFERENCE.md` - This file

### Modified
- ✅ `backend/app.py` - CORS configuration
- ✅ `frontend/src/services/api.ts` - Environment variable
- ✅ `frontend/src/services/appointmentService.ts` - Environment variable

---

## 🐛 Common Issues

### "CORS Error"
- Ensure Azure CORS is empty
- Restart Flask backend
- Clear browser cache

### "API URL not changing"
- Restart Next.js dev server after editing `.env.local`
- Check variable name: `NEXT_PUBLIC_API_URL`

### "404 on API calls"
- Verify backend is running
- Check URL in `.env.local` matches backend

---

## 📞 Quick Commands

```bash
# Check Python version
python --version

# Start backend
cd backend && python app.py

# Start frontend
cd frontend && npm run dev

# View environment variable (in browser console)
console.log(process.env.NEXT_PUBLIC_API_URL)
```
