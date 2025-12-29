# Fix: "Network is unreachable" - Supabase Connection

## Problem
Your server cannot reach Supabase database: `db.ltveafhtsxylygslitwz.supabase.co`

Error: `java.net.SocketException: Network is unreachable`

## Solutions

### Solution 1: Fix AWS Security Group (If using AWS EC2/Elastic Beanstalk)

1. **Go to AWS Console** → **EC2** → **Security Groups**
2. Find your server's security group (check Elastic Beanstalk environment)
3. Click **Outbound rules** → **Edit outbound rules**
4. **Add rule**:
   - Type: **Custom TCP**
   - Port: **5432**
   - Destination: **0.0.0.0/0** (or Supabase IP range if known)
   - Description: "Allow Supabase PostgreSQL"
5. **Save rules**

### Solution 2: Check Supabase Network Restrictions

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Database** → **Connection Pooling**
4. Check **Network Restrictions** / **IP Allowlist**
5. **Add your server's IP** to the allowlist:
   - For AWS: Find your server's public IP
   - Or allow all IPs temporarily: `0.0.0.0/0` (less secure)

### Solution 3: Test Connection from Server

SSH into your server and test:

```bash
# Test if server can reach Supabase
ping db.ltveafhtsxylygslitwz.supabase.co

# Test PostgreSQL connection
psql "postgresql://postgres:GuhanAein%40123@db.ltveafhtsxylygslitwz.supabase.co:5432/postgres?sslmode=require" -c "SELECT 1;"

# Or with telnet
telnet db.ltveafhtsxylygslitwz.supabase.co 5432
```

### Solution 4: Use Direct Connection Port (Not Pooling)

Supabase has two ports:
- **5432**: Direct connection (bypasses PgBouncer)
- **6543**: Connection pooling (PgBouncer)

Try using port **5432** directly:

```bash
# Set in environment variables
DB_PORT=5432
```

### Solution 5: Check Server Internet Access

Verify the server has internet access:

```bash
# On your server
ping 8.8.8.8
curl -I https://google.com
```

If these fail, the server has no internet access - fix network configuration.

---

## Quick Fix Checklist

✅ **AWS Security Group**: Allow outbound TCP 5432  
✅ **Supabase IP Allowlist**: Add server IP or allow all  
✅ **Port**: Use 5432 (direct) not 6543 (pooling)  
✅ **Internet Access**: Verify server can reach internet  
✅ **SSL Mode**: Ensure `sslmode=require` is in connection string  

---

## Alternative: Use Railway PostgreSQL (If on Railway)

If you're on Railway and Supabase won't work:

1. In Railway dashboard → **+ New** → **Database** → **Add PostgreSQL**
2. Railway automatically provides `DATABASE_URL`
3. Remove `DB_*` variables
4. App will use `DATABASE_URL` automatically

---

## Verify Fix

After applying fixes, restart your app and check logs:

```bash
# Should see successful connection
✅ Constructed DATABASE_URL from DB_* variables
HikariPool-1 - Start completed.
```

If still failing, share the new error message!
