# Deploy alpha na DigitalOcean

Ovaj workflow je najprakticniji trenutni deployment model za projekat:

- build se radi na Dropletu
- koristi se poseban `alpha` compose stack
- host Nginx terminira TLS za `alpha.ferinav.app`
- frontend container je dostupan samo na `127.0.0.1:8081`

Ovaj model je namenjen za alpha/staging okruzenje. Ne uvodi registry, CI image publishing ili dodatnu infrastrukturnu slozenost.

## Fajlovi

- root compose: [docker-compose.alpha.yml](D:/Feri%20Navigator/FERI-Navigator/docker-compose.alpha.yml)
- env primer: [.env.alpha.example](D:/Feri%20Navigator/FERI-Navigator/.env.alpha.example)
- host nginx config: [deploy/nginx/alpha.ferinav.app.conf](D:/Feri%20Navigator/FERI-Navigator/deploy/nginx/alpha.ferinav.app.conf)

## DNS

Na Name.com postavi:

- `A` record za host `alpha` na IPv4 adresu Dropleta

## Server bootstrap

Na Ubuntu Dropletu:

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## Deploy koraci

```bash
cd /opt
git clone YOUR_REPO_URL feri-navigator-alpha
cd feri-navigator-alpha
cp .env.alpha.example .env
nano .env
docker compose -f docker-compose.alpha.yml up -d --build
cp deploy/nginx/alpha.ferinav.app.conf /etc/nginx/sites-available/alpha.ferinav.app
ln -s /etc/nginx/sites-available/alpha.ferinav.app /etc/nginx/sites-enabled/alpha.ferinav.app
nginx -t
systemctl reload nginx
certbot --nginx -d alpha.ferinav.app
certbot renew --dry-run
```

## Verifikacija

```bash
docker compose -f docker-compose.alpha.yml ps
docker compose -f docker-compose.alpha.yml logs --tail 200 backend
docker compose -f docker-compose.alpha.yml logs --tail 200 frontend
curl http://127.0.0.1:8081
curl http://127.0.0.1:8081/api/actuator/health/readiness
```

## Sledeci deploy

```bash
cd /opt/feri-navigator-alpha
git pull
docker compose -f docker-compose.alpha.yml up -d --build
docker image prune -f
```
