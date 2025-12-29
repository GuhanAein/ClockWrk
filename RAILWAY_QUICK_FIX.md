# Railway Quick Fix Guide

## Most Common Issue: Database Connection

Railway crashes are usually caused by **database connection failures**. Here's the quick fix:

### Option 1: Use Railway PostgreSQL (Recommended - Easier)

1. In Railway dashboard, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway automatically creates `DATABASE_URL` environment variable
3. Your app will use it automatically (no need for `DB_*` variables)
4. ✅ Done! This is the easiest solution.

### Option 2: Use Supabase (Current Setup)

Make sure these environment variables are set in Railway:

```
DB_HOST=db.ltveafhtsxylygslitwz.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=GuhanAein@123
```

**Important**: 
- Remove `DATABASE_URL` if you're using `DB_*` variables
- Make sure Supabase allows connections from Railway (check IP restrictions)

---

## Quick Checklist

✅ **Port**: Railway sets `PORT` automatically - app uses `${PORT:8080}`  
✅ **Database**: Either use Railway PostgreSQL OR set all `DB_*` variables  
✅ **Java**: `nixpacks.toml` ensures Java 21 is used  
✅ **Build**: `railway.json` configures build/start commands  
✅ **Health Check**: Set to `/api/health` in Railway settings  

---

## Check Railway Logs

1. Go to Railway dashboard
2. Click on your service
3. Go to **Deployments** tab
4. Click on latest deployment
5. Check **Logs** for errors

Common errors you'll see:
- `Connection refused` → Database connection issue
- `FATAL: no such user` → Wrong database credentials
- `OutOfMemoryError` → Memory limit exceeded (add `JAVA_OPTS`)
- `Port already in use` → Port configuration issue

---

## Still Crashing?

Share the error from Railway logs and I'll help debug!
