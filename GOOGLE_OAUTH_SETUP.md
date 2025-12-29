# Google OAuth2 Redirect URI Setup

## ❌ Error: redirect_uri_mismatch

This error occurs when the redirect URI in your Google Cloud Console doesn't match what your application is sending.

## ✅ Solution

### Step 1: Add Redirect URIs to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID: `499112612026-a3b60fvja7vsp9nmgshqdr4o7ntjvd7v.apps.googleusercontent.com`
5. Under **Authorized redirect URIs**, add these URIs:

#### For Local Development:
```
http://localhost:8080/login/oauth2/code/google
```

#### For Production:
```
https://clockwrk.in/login/oauth2/code/google
```
OR (if you have a separate API domain):
```
https://api.clockwrk.in/login/oauth2/code/google
```

### Step 2: Verify Your Configuration

#### Local Development (`.env.local`):
```bash
GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
```

#### Production (AWS Environment Variables):
```bash
GOOGLE_REDIRECT_URI=https://clockwrk.in/login/oauth2/code/google
```

### Step 3: How It Works

1. User clicks "Sign in with Google" on frontend (`localhost:4200`)
2. Frontend redirects to backend OAuth endpoint (`localhost:8080/oauth2/authorization/google`)
3. Backend redirects to Google OAuth
4. **Google sends callback to backend**: `http://localhost:8080/login/oauth2/code/google` ← This must match Google Console!
5. Backend processes OAuth, generates JWT tokens
6. Backend redirects to frontend: `http://localhost:4200/oauth2/redirect?token=...`

## 🔍 Important Notes

- **Redirect URI = Backend URL**, not frontend URL
- The redirect URI must match **exactly** (including `http://` vs `https://`, port numbers, trailing slashes)
- After adding URIs in Google Console, changes take effect immediately (no need to wait)

## ✅ Verification

After adding the redirect URI:
1. Restart your backend: `./run.sh`
2. Try signing in with Google again
3. The error should be resolved!

## 📝 Current Configuration

- **Local Backend**: `http://localhost:8080`
- **Local Frontend**: `http://localhost:4200`
- **Production Backend**: `https://clockwrk.in` (or your API domain)
- **Production Frontend**: `https://www.clockwrk.in`
