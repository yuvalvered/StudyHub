#!/bin/bash
set -e

echo "=== Setting up nginx + HTTPS for StudyHub ==="

# Install nginx
sudo apt-get update -y
sudo apt-get install -y nginx openssl

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate self-signed certificate (valid 2 years)
sudo openssl req -x509 -nodes -days 730 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/studyhub.key \
    -out    /etc/nginx/ssl/studyhub.crt \
    -subj   "/C=IL/ST=Israel/L=BeerSheva/O=StudyHub/CN=132.73.84.63"

# Copy nginx config
sudo cp "$(dirname "$0")/studyhub.conf" /etc/nginx/sites-available/studyhub
sudo ln -sf /etc/nginx/sites-available/studyhub /etc/nginx/sites-enabled/studyhub

# Disable default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo ""
echo "=== Done! ==="
echo "Site is now available at: https://132.73.84.63"
echo "Note: Browser will warn about self-signed certificate — this is expected."
echo "Once you add a DNS record, run Certbot to get a free trusted certificate."
