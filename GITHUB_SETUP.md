# GitHub Setup Guide

Follow these steps to upload your Inventory Tracker project to GitHub.

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `Inventory_Tracker_DH` (or your preferred name)
   - **Description**: "Full-stack inventory management system with real-time stock monitoring"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Initialize Git (if not already done)

Open your terminal/command prompt in the project directory and run:

```bash
# Check if git is already initialized
git status

# If not initialized, run:
git init
```

## Step 3: Add All Files

```bash
# Add all files to staging
git add .

# Check what will be committed (make sure .env is NOT listed)
git status
```

**Important**: Verify that `.env` is NOT in the list. If it is, check your `.gitignore` file.

## Step 4: Make Your First Commit

```bash
git commit -m "Initial commit: Inventory Tracker with frontend and backend"
```

## Step 5: Connect to GitHub

```bash
# Add your GitHub repository as remote (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Verify the remote was added
git remote -v
```

## Step 6: Push to GitHub

```bash
# Push to GitHub (first time)
git branch -M main
git push -u origin main
```

If prompted for credentials:
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (not your GitHub password)
  - Generate one at: https://github.com/settings/tokens
  - Select scope: `repo`

## Step 7: Verify Upload

1. Go to your GitHub repository page
2. You should see all your files
3. **Verify that `.env` is NOT visible** (it should be ignored)

## Important Security Notes

### ✅ What's Protected (in .gitignore):
- `.env` file (contains sensitive data)
- `node_modules/` (dependencies)
- Build files
- Log files

### ⚠️ What You Should NOT Commit:
- `.env` file
- Database credentials
- Email passwords
- JWT secrets
- Any API keys

### 📝 What You SHOULD Include:
- `README.md` ✅
- Source code ✅
- `package.json` ✅
- Configuration files (without secrets) ✅

## Creating a .env.example File

Create a template file that others can use:

```bash
# Create .env.example (this WILL be committed)
cp .env .env.example
```

Then edit `.env.example` and replace all actual values with placeholders:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# Server
PORT=5000

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Admin Email
ADMIN_EMAIL=admin@example.com

# Low Stock Threshold
LOW_STOCK_THRESHOLD=10
```

## Future Updates

When you make changes:

```bash
# Check what changed
git status

# Add changed files
git add .

# Commit with a message
git commit -m "Description of your changes"

# Push to GitHub
git push
```

## Troubleshooting

### "Repository not found" error
- Check that the repository URL is correct
- Verify you have access to the repository
- Make sure you're using the correct authentication (Personal Access Token)

### ".env file is showing in GitHub"
- Remove it from git tracking:
  ```bash
  git rm --cached .env
  git commit -m "Remove .env from tracking"
  git push
  ```
- Verify `.env` is in `.gitignore`

### "Permission denied" error
- Use a Personal Access Token instead of password
- Check your token has the correct scopes

## Repository Structure on GitHub

Your repository should look like this:

```
Inventory_Tracker_DH/
├── .gitignore          ✅
├── README.md           ✅
├── package.json        ✅
├── server.js           ✅
├── config/             ✅
├── controllers/        ✅
├── Models/             ✅
├── routes/             ✅
├── frontend/           ✅
├── utils/              ✅
├── jobs/               ✅
└── .env.example        ✅ (template, no secrets)
```

## Next Steps After Uploading

1. **Add a license** (optional):
   - Go to your repo → Settings → Add file → Create new file
   - Name it `LICENSE`
   - Choose a license (MIT, ISC, etc.)

2. **Add topics/tags** to your repository:
   - Go to your repo → Click the gear icon next to "About"
   - Add topics: `inventory-management`, `nodejs`, `react`, `mongodb`, `express`

3. **Enable GitHub Pages** (optional, for frontend demo):
   - Settings → Pages
   - Source: `gh-pages` branch or `main` branch `/docs` folder

4. **Add collaborators** (if working with others):
   - Settings → Collaborators → Add people

## Security Checklist

Before pushing, verify:
- [ ] `.env` is in `.gitignore`
- [ ] No passwords in code
- [ ] No API keys in code
- [ ] No database connection strings in code
- [ ] `.env.example` exists with placeholders
- [ ] README.md doesn't contain sensitive info

---

**Your project is now on GitHub! 🎉**

Share your repository URL with others, and they can clone it using:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```










