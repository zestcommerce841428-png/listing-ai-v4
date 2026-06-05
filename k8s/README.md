# ListingAI v4 — Kubernetes & CI/CD Guide

## Architecture

```
GitHub Push → GitHub Actions CI → Docker Build → ghcr.io → kubectl apply → Kubernetes
```

## Files Created

| File | Purpose |
|------|---------|
| `.github/workflows/ci-cd.yml` | Full CI/CD pipeline |
| `k8s/manifests.yaml` | All K8s resources (Namespace, ConfigMap, Secret, MySQL, Redis, App, HPA, Ingress) |

---

## CI/CD Pipeline Stages

1. **Lint** — TypeScript type check + ESLint on every push/PR
2. **Build** — `next build` to verify the app compiles
3. **Docker** — Build multi-stage Docker image, push to `ghcr.io`
4. **Deploy** — `kubectl set image` + `kubectl apply` + wait for rollout + run DB migrations

### Required GitHub Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New secret**

| Secret | Value |
|--------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key |
| `CLERK_SECRET_KEY` | Your Clerk secret key |
| `NEXT_PUBLIC_APP_URL` | `https://listingai.app` |
| `KUBECONFIG` | `base64 -w0 ~/.kube/config` output |

---

## Kubernetes Setup

### 1. Prerequisites
```bash
# Install kubectl
# Install a cluster: k3s (cheapest), EKS, GKE, DigitalOcean, Linode

# Install nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager (free TLS)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

### 2. Update secrets before deploying
Edit `k8s/manifests.yaml` — replace these values:
- `DATABASE_URL` — your MySQL password
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk key
- `CLERK_SECRET_KEY` — Clerk secret
- `SUPER_ADMIN_CLERK_ID` — your Clerk user ID
- `REPLACE_GITHUB_OWNER` — your GitHub username in the image path

### 3. Deploy
```bash
# Apply everything
kubectl apply -f k8s/manifests.yaml

# Check status
kubectl get all -n listing-ai

# Run migrations (first time)
kubectl exec -n listing-ai deployment/listing-ai-app -- npx prisma db push

# Seed categories
kubectl exec -n listing-ai deployment/listing-ai-app -- curl http://localhost:3000/api/categories/seed
```

### 4. Scale
```bash
# Manual scale
kubectl scale deployment listing-ai-app --replicas=5 -n listing-ai

# HPA handles auto-scaling (2–10 pods based on CPU/memory)
kubectl get hpa -n listing-ai
```

---

## Admin Panel Access

### Step 1 — Sign in
Visit `https://your-domain.com/sign-in` and create/sign in to your account.

### Step 2 — Get your Clerk User ID
1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Click **Users** → click your user
3. Copy the **User ID** (starts with `user_`)

### Step 3 — Set Super Admin
Add to your `.env.local` (local) or Kubernetes Secret:
```
SUPER_ADMIN_CLERK_ID=user_xxxxxxxxxxxxxxxxxxxx
SUPER_ADMIN_EMAIL=your@email.com
```
Restart the server.

### Step 4 — Run Setup API
```bash
# Local
curl http://localhost:3001/api/setup

# Production
curl https://listingai.app/api/setup
```

### Step 5 — Access Admin Panel
Visit: `https://your-domain.com/admin`

You'll see:
- 👥 User Management — view/ban/update plans
- 💬 Contact Messages — read & reply
- 📝 Blog Manager — create/edit/delete posts  
- ⚙️ Site Settings — all platform settings
