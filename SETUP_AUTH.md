# 🔐 Authentication Setup Guide

This guide will help you set up Cloudflare Turnstile (Captcha) and Google OAuth for your Devora application.

## 📋 Prerequisites

- Cloudflare account (free)
- Google Cloud Console account (free)
- Your application URL (e.g., `http://localhost:3000` for development)

---

## 1️⃣ Cloudflare Turnstile Setup (FREE)

### Step 1: Get Turnstile Keys

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile** in the sidebar
3. Click **Add Site**
4. Fill in:
   - **Site name**: Devora (or your app name)
   - **Domain**: `localhost` (for development) or your production domain
   - **Widget Mode**: Managed (recommended)
5. Click **Create**
6. Copy your **Site Key** and **Secret Key**

### Step 2: Add to Environment Variables

Add these to your `.env` file:

```bash
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

**Note:** `NEXT_PUBLIC_` prefix makes it available in the browser.

---

## 2️⃣ Google OAuth Setup (FREE)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it "Devora OAuth" (or your preference)
4. Click **Create**

### Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the **OAuth consent screen**:
   - User Type: **External**
   - App name: **Devora**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Skip (click **Save and Continue**)
   - Test users: Add your email (for development)
   - Click **Save and Continue**

4. Back to **Create OAuth client ID**:
   - Application type: **Web application**
   - Name: **Devora Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
   - Click **Create**

5. Copy your **Client ID** and **Client Secret**

### Step 4: Add to Environment Variables

Add these to your `.env` file:

```bash
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
```

---

## 3️⃣ NextAuth Configuration

### Add NextAuth Secret

Generate a random secret:

```bash
openssl rand -base64 32
```

Add to your `.env` file:

```bash
# NextAuth
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**For production**, change `NEXTAUTH_URL` to your production URL.

---

## 4️⃣ Complete .env File Example

Your `.env` file should look like this:

```bash
# Database
DATABASE_URL="mysql://user:password@localhost:3306/devora"

# JWT (existing)
JWT_SECRET=your_existing_jwt_secret

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=123456789-abc...apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-abc...

# NextAuth
NEXTAUTH_SECRET=generated_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# ... other existing env vars
```

---

## 5️⃣ Testing

### Test Turnstile (Captcha)

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. You should see the Turnstile widget (checkbox or invisible)
4. Complete the captcha and try logging in

### Test Google OAuth

1. On login/register page, click the Google button
2. You'll be redirected to Google sign-in
3. Sign in with your Google account
4. You'll be redirected back to your dashboard
5. Check your database - a new user should be created

---

## 🔧 Troubleshooting

### Turnstile Issues

**Error: "Captcha verification failed"**

- Check if `TURNSTILE_SECRET_KEY` is correct
- Verify domain matches in Cloudflare dashboard

**Turnstile widget not showing**

- Check if `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set
- Clear browser cache and reload

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**

- Check authorized redirect URIs in Google Console
- Must be exactly: `http://localhost:3000/api/auth/callback/google`

**Error: "Access blocked: This app's request is invalid"**

- Complete OAuth consent screen configuration
- Add your email as a test user

**User created but not logged in**

- Check if `JWT_SECRET` is set
- Check browser console for errors

---

## 🚀 Production Deployment

### Before deploying:

1. **Update Turnstile domain**:
   - Add your production domain in Cloudflare dashboard

2. **Update Google OAuth URIs**:
   - Add production URLs to authorized origins and redirect URIs

3. **Update environment variables**:

   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   ```

4. **Security checklist**:
   - ✅ All secrets are in `.env` (not committed to git)
   - ✅ `.env` is in `.gitignore`
   - ✅ Production URLs are HTTPS
   - ✅ OAuth consent screen is configured

---

## 📚 Additional Resources

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)

---

## ✅ Features Implemented

- ✅ Cloudflare Turnstile captcha on login/register
- ✅ Google OAuth sign-in/sign-up
- ✅ Bot protection
- ✅ Seamless integration with existing auth system
- ✅ User data synced to your database
- ✅ All existing features still work

---

## 🆘 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check server logs (`npm run dev` output)
3. Verify all environment variables are set correctly
4. Make sure dependencies are installed: `npm install`

Happy coding! 🎉
