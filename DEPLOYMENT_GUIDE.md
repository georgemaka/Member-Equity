# Production Deployment Guide 🚀

This guide will help you deploy your Member Equity Management application to production. We'll cover multiple deployment options from beginner-friendly to more advanced setups.

## 📋 Overview

Your application consists of:
- **Frontend**: React + TypeScript + Vite
- **Backend**: NestJS + TypeScript + Prisma
- **Database**: PostgreSQL
- **Cache**: Redis (optional for production)

## 🎯 Recommended Deployment Path for Beginners

### Option 1: Vercel + Railway (Easiest) ⭐

**Best for**: Beginners, quick setup, automatic deployments
**Cost**: ~$5-20/month to start

#### Step 1: Prepare Your Code

1. **Create a GitHub Repository**
   ```bash
   # If you haven't already
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/member-equity.git
   git push -u origin main
   ```

2. **Environment Variables Setup**
   - Create `.env.example` files in both frontend and backend folders
   - List all required environment variables (without values)

#### Step 2: Deploy Database (Railway)

1. **Sign up for Railway** at [railway.app](https://railway.app)
2. **Create New Project** → **Deploy PostgreSQL**
3. **Get Database URL** from Railway dashboard
4. **Note down the connection string** (looks like: `postgresql://user:pass@host:port/dbname`)

#### Step 3: Deploy Backend (Railway)

1. **In Railway dashboard** → **New Service** → **GitHub Repo**
2. **Select your repository** and choose the `backend` folder
3. **Set Environment Variables**:
   ```
   DATABASE_URL=your_railway_postgres_url
   JWT_SECRET=your_super_secret_jwt_key_here
   NODE_ENV=production
   PORT=3000
   ```
4. **Railway will auto-deploy** from your GitHub repo
5. **Get your backend URL** (e.g., `https://your-app-production.up.railway.app`)

#### Step 4: Deploy Frontend (Vercel)

1. **Sign up for Vercel** at [vercel.com](https://vercel.com)
2. **Import Git Repository** → Select your GitHub repo
3. **Framework Preset**: Vite
4. **Root Directory**: `frontend`
5. **Set Environment Variables**:
   ```
   VITE_API_URL=your_railway_backend_url
   VITE_APP_NAME=Member Equity Management
   ```
6. **Deploy** - Vercel handles the build automatically
7. **Get your frontend URL** (e.g., `https://your-app.vercel.app`)

#### Step 5: Configure Database

1. **Connect to your Railway database** using a tool like:
   - [TablePlus](https://tableplus.com/) (recommended)
   - [pgAdmin](https://www.pgadmin.org/)
   - Or use Railway's built-in query tool

2. **Run database migrations**:
   ```bash
   # In your backend folder
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

### Option 2: AWS (More Control) 🔧

**Best for**: Learning cloud platforms, more customization
**Cost**: ~$10-50/month depending on usage

#### Step 1: AWS Account Setup

1. **Create AWS Account** at [aws.amazon.com](https://aws.amazon.com)
2. **Set up billing alerts** (important!)
3. **Create IAM user** with appropriate permissions

#### Step 2: Database (AWS RDS)

1. **Go to RDS** in AWS Console
2. **Create Database** → **PostgreSQL**
3. **Choose Free Tier** if eligible
4. **Configuration**:
   - DB instance: `db.t3.micro` (free tier)
   - Storage: 20 GB
   - Username/Password: Save these securely
5. **Security Group**: Allow connections from your apps

#### Step 3: Backend (AWS Elastic Beanstalk)

1. **Prepare your backend**:
   ```bash
   # In backend folder, create .ebextensions/environment.config
   mkdir .ebextensions
   ```

2. **Create environment.config**:
   ```yaml
   option_settings:
     aws:elasticbeanstalk:application:environment:
       NODE_ENV: production
       DATABASE_URL: your_rds_connection_string
       JWT_SECRET: your_jwt_secret
   ```

3. **Install EB CLI**:
   ```bash
   pip install awsebcli
   ```

4. **Deploy**:
   ```bash
   eb init
   eb create production
   eb deploy
   ```

#### Step 4: Frontend (AWS S3 + CloudFront)

1. **Build your frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Create S3 Bucket** for static hosting
3. **Upload dist folder** to S3
4. **Set up CloudFront** distribution for global CDN
5. **Configure custom domain** (optional)

---

### Option 3: Digital Ocean (Balance of Ease + Control) 🌊

**Best for**: Developers who want some control without AWS complexity
**Cost**: ~$12-25/month

#### Step 1: Digital Ocean Setup

1. **Create account** at [digitalocean.com](https://digitalocean.com)
2. **Create App Platform project**
3. **Connect GitHub repository**

#### Step 2: Database

1. **Create Managed PostgreSQL Database**
2. **Choose Basic plan** ($15/month)
3. **Note connection details**

#### Step 3: Configure App

1. **Frontend Component**:
   - Source: GitHub repo, frontend folder
   - Build command: `npm run build`
   - Environment variables: `VITE_API_URL`

2. **Backend Component**:
   - Source: GitHub repo, backend folder
   - Build command: `npm run build`
   - Run command: `npm run start:prod`
   - Environment variables: Database URL, JWT secret

---

## 🔒 Security Checklist

### Environment Variables (Critical!)

**Never commit these to Git**:
- Database passwords
- JWT secrets
- API keys
- Auth0 credentials

**Use environment variables for**:
```bash
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=super_secret_key
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# Frontend
VITE_API_URL=https://your-backend-url.com
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
```

### Domain & SSL

1. **Custom Domain** (Optional but recommended):
   - Buy domain from Namecheap, GoDaddy, etc.
   - Configure DNS to point to your deployment

2. **SSL Certificate** (Usually automatic with modern platforms):
   - Vercel/Railway/DO App Platform handle this automatically
   - For AWS, use Certificate Manager

### Database Security

1. **Backup Strategy**:
   - Most managed databases auto-backup
   - Set up automated backups for 30 days

2. **Access Control**:
   - Whitelist IP addresses if possible
   - Use connection pooling in production

---

## 📊 Monitoring & Maintenance

### Basic Monitoring

1. **Application Monitoring**:
   - Vercel/Railway provide basic analytics
   - Consider [Sentry](https://sentry.io) for error tracking

2. **Database Monitoring**:
   - Watch for slow queries
   - Monitor connection counts
   - Set up alerts for high CPU usage

### Performance Optimization

1. **Frontend**:
   - Enable compression (gzip)
   - Optimize images
   - Use CDN for static assets

2. **Backend**:
   - Database query optimization
   - Enable Redis for caching (if needed)
   - Monitor API response times

---

## 💰 Cost Estimates

### Starter Setup (Recommended)
- **Railway (Backend + Database)**: $5-15/month
- **Vercel (Frontend)**: Free tier available
- **Total**: ~$5-15/month

### Growing Business
- **Digital Ocean App Platform**: $12-25/month
- **Managed Database**: $15/month
- **CDN/Domain**: $2-5/month
- **Total**: ~$30-45/month

### Enterprise Scale
- **AWS/Azure with reserved instances**: $50-200+/month
- **Multiple environments**: Development, Staging, Production
- **Advanced monitoring and security**

---

## 🚀 Quick Start Commands

### Local Development
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Production Build Test
```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run preview
```

---

## 📞 Getting Help

### Common Issues

1. **Database Connection Errors**:
   - Check DATABASE_URL format
   - Verify database is running
   - Check firewall/security groups

2. **Frontend Can't Reach Backend**:
   - Verify VITE_API_URL is correct
   - Check CORS settings in backend
   - Ensure backend is deployed and running

3. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are listed in package.json
   - Review build logs for specific errors

### Resources

- **Documentation**: Your app has detailed docs in `docs/` folder
- **Community**: Stack Overflow, Reddit r/webdev
- **Platform Support**: Each platform has excellent documentation
  - [Vercel Docs](https://vercel.com/docs)
  - [Railway Docs](https://docs.railway.app)
  - [Digital Ocean Docs](https://docs.digitalocean.com)

---

## 🎉 Congratulations!

Once deployed, your Member Equity Management system will be live and accessible to users worldwide. Remember to:

1. **Test thoroughly** in production environment
2. **Set up monitoring** and alerts
3. **Plan for scaling** as your user base grows
4. **Keep dependencies updated** for security

Your app handles sensitive financial data, so security and reliability should always be top priorities. Start with the simple deployment option and evolve your infrastructure as your needs grow.

**Happy deploying!** 🚀