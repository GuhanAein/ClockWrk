# Google OAuth Redirect URI Fix for IP Address

## ⚠️ Important: Update Google OAuth Redirect URI

Your backend is now at: `http://44.195.2.208:8080`

You **MUST** update the redirect URI in Google Cloud Console:

### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID: `499112612026-a3b60fvja7vsp9nmgshqdr4o7ntjvd7v.apps.googleusercontent.com`
5. Under **Authorized redirect URIs**, add:
   ```
   http://44.195.2.208:8080/login/oauth2/code/google
   ```
6. **Save**

### Current Error

The error you're seeing:
```
Error 400: invalid_request
redirect_uri: http://44.195.2.208/login/oauth2/code/google
```

This means Google doesn't recognize this redirect URI. After adding it to Google Console, it will work.

### Also Update Backend Environment Variable

Make sure your backend has this environment variable set:
```
GOOGLE_REDIRECT_URI=http://44.195.2.208:8080/login/oauth2/code/google
```

---

## Frontend Updated ✅

The frontend production environment has been updated to:
- `baseUrl: 'http://44.195.2.208:8080'`
- `apiUrl: 'http://44.195.2.208:8080/api'`

After rebuilding and deploying the frontend, it will use the new backend URL.
