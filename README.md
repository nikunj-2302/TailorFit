# TailorFit Pro — Clothing Measurement & Uniform Management System

A full-stack enterprise web application for uniform businesses managing organizations, branches, staff, garment types, dynamic measurement templates, versioned fitting history, and order production workflows.

---

## 🚀 Deployment Options

You have **two great deployment methods** (both 100% free tier):

### Option 1: All-in-One Single Deployment on Vercel (Recommended)
You can deploy both **Frontend + Backend together in ONE single Vercel project** using the included [`vercel.json`](file:///c:/Users/lenovo/Downloads/Krishna/vercel.json) and [`api/index.js`](file:///c:/Users/lenovo/Downloads/Krishna/api/index.js).

1. Push this project repository to **GitHub**.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Leave Root Directory as `./` (Root).
5. Add the following **Environment Variables** in Vercel:
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/uniform_db?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_secure_jwt_random_secret_key`
   - `NODE_ENV`: `production`
6. Click **Deploy**. Vercel will build the React Vite frontend and serve the Express backend API automatically under `/api/*` on the same domain (no CORS configuration needed!).

---

### Option 2: Two Separate Free Deployments (Render / Railway for Backend + Vercel for Frontend)

#### Step 1: Deploy Backend on Render.com (Free Tier)
1. Go to [Render.com](https://render.com) -> Click **"New Web Service"** -> Connect your GitHub repo.
2. Configure settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `MONGODB_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `your_secure_jwt_secret`
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
4. Copy your backend URL (e.g. `https://uniform-backend.onrender.com`).

#### Step 2: Deploy Frontend on Vercel
1. In Vercel, click **"Add New Project"** -> Import the same GitHub repo.
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://uniform-backend.onrender.com/api`
5. Click **Deploy**.

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@example.com` | `Admin@123` |
| **Admin** | `mehul.admin@example.com` | `Admin@123` |
| **Measurement Staff** | `measurer@example.com` | `User@123` |
| **Production User** | `production@example.com` | `User@123` |

*(You can also use the **1-Click Demo Login** buttons directly on the login screen)*

---

## 💻 Running Locally

### 1. Backend (Terminal 1)
```bash
cd server
npm install
npm run dev
```
*(Automatically connects to local MongoDB or embedded in-memory MongoDB with initial demo data)*

### 2. Frontend (Terminal 2)
```bash
cd client
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.
