# SGWA API - VPS Deployment Guide

This guide details how to deploy the **SGWA API** on a Linux VPS (Ubuntu 20.04/22.04 recommended) using Docker.

## Prerequisites
1.  **VPS**: A Linux server (e.g., AWS EC2, DigitalOcean Droplet, Linode) with at least 2GB RAM.
2.  **Domain**: A domain name pointing to your VPS IP address (e.g., `api.sgwa.gov.in`).
3.  **SSH Access**: Root or sudo user access to the server.

---

## Step 1: Install Docker & Docker Compose
Connect to your VPS via SSH and run the following commands to install Docker.

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Verify installation
sudo docker --version
sudo docker compose version
```

---

## Step 2: Deploy the Application

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_REPO/sgwa-api.git
cd sgwa-api
```
*(Alternatively, you can upload your project folder using FileZilla or SCP)*

### 2. Configure Environment Variables
Create the production `.env` file.
```bash
cp .env.example .env
nano .env
```
**Important Changes for Production:**
*   `NODE_ENV=production`
*   `PORT=5000`
*   `MONGODB_URI`: Use the Docker service name if running Mongo in container (e.g., `mongodb://mongo:27017/sgwa_db`) OR your Atlas connection string.
*   Update `JWT_SECRET` to a strong random string.

### 3. Start the Application
```bash
sudo docker compose up -d --build
```
This will build the image and start the container in the background.

*   Check status: `sudo docker compose ps`
*   View logs: `sudo docker compose logs -f`

---

## Step 3: Set Up Nginx Reverse Proxy (Recommended)
Instead of exposing port 5000 directly, use Nginx to handle traffic and SSL.

### 1. Install Nginx
```bash
sudo apt install nginx -y
```

### 2. Configure Nginx
Create a config file for your API.
```bash
sudo nano /etc/nginx/sites-available/sgwa-api
```

Paste the following (replace `api.example.com` with your domain):
```nginx
server {
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/sgwa-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 4: Setup SSL (HTTPS) with Certbot
Secure your API with a free Let's Encrypt certificate.

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain Certificate
sudo certbot --nginx -d api.example.com
```
Follow the prompts. Certbot will automatically update your Nginx config to serve over HTTPS.

## Step 5: Updating the App
When you have new code changes:
1.  Pull the changes: `git pull`
2.  Rebuild container: `sudo docker compose up -d --build`
