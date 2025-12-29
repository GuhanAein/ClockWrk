# Quick Fix: Network Unreachable

## Immediate Steps

### 1. Check Server Internet Access
```bash
# SSH into your server
ssh ubuntu@your-server-ip

# Test internet
ping 8.8.8.8
curl -I https://google.com
```

### 2. Test Supabase Connection
```bash
# On your server
telnet db.ltveafhtsxylygslitwz.supabase.co 5432
# OR
nc -zv db.ltveafhtsxylygslitwz.supabase.co 5432
```

### 3. Fix AWS Security Group (Most Common Fix)

**If using AWS EC2/Elastic Beanstalk:**

1. AWS Console → **EC2** → **Security Groups**
2. Find security group attached to your instance
3. **Outbound rules** → **Edit**
4. Add:
   - Type: **All TCP** or **Custom TCP**
   - Port: **5432**
   - Destination: **0.0.0.0/0**
5. **Save**

### 4. Check Supabase Settings

1. [Supabase Dashboard](https://supabase.com/dashboard)
2. Your project → **Settings** → **Database**
3. Check **Connection Pooling** / **Network Restrictions**
4. Add your server's public IP to allowlist
5. Or temporarily allow all: `0.0.0.0/0`

### 5. Verify Environment Variables

On your server, check:
```bash
echo $DB_HOST
echo $DB_PORT
echo $DB_USERNAME
```

Should be:
```
DB_HOST=db.ltveafhtsxylygslitwz.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
```

---

## Most Likely Issue

**AWS Security Group blocking outbound connections to Supabase**

Fix: Add outbound rule for port 5432 to `0.0.0.0/0`

---

## After Fixing

Restart your application:
```bash
# Stop current process
pkill -f "java -jar app.jar"

# Start again
java -jar app.jar
```

Check logs - should see successful database connection!
