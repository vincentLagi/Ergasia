# HTTPS tanpa domain (pakai sslip.io)

Kalau belum punya domain, kamu tetap bisa pakai HTTPS yang trusted (tanpa warning di browser) dengan hostname berbasis IP dari layanan wildcard DNS seperti sslip.io. Contoh: `advisor.130.211.124.157.sslip.io` akan resolve ke IP `130.211.124.157`.

Catatan penting:
- Let's Encrypt TIDAK menerbitkan sertifikat untuk alamat IP langsung (https://<IP>), jadi kita perlu hostname. sslip.io menyediakan hostname otomatis berbasis IP dan bisa dipakai untuk sertifikat.
- Alternatif lain: nip.io (mirip), Cloudflare Tunnel (`*.trycloudflare.com`), atau ngrok (subdomain acak). Di repo ini, kita siapkan jalur sslip.io karena paling sederhana.

## Arsitektur singkat

Browser (HTTPS) → Caddy/Nginx (443, sertifikat otomatis) → backend HTTP lokal (127.0.0.1:8002 untuk Advisor, 127.0.0.1:8000 untuk Face)

## Opsi A — Caddy (paling simpel)

1) Install Caddy (Ubuntu/Debian)
- https://caddyserver.com/docs/install#debian-ubuntu

2) Pakai file `ops/caddy/Caddyfile`
- Ubah IP di hostname jika server IP kamu berubah.
- Pastikan service backend kamu listen di 127.0.0.1:8002 (Advisor) dan 127.0.0.1:8000 (Face). Kalau service di host lain, ganti `reverse_proxy` ke alamat yang benar.

3) Jalankan Caddy
- (Opsional) matikan web server lain yang listen 80/443.
- Jalankan: `sudo caddy run --config /path/to/ops/caddy/Caddyfile`
- Caddy akan otomatis ambil sertifikat Let's Encrypt untuk:
  - `advisor.<IP>.sslip.io`
  - `face.<IP>.sslip.io`

4) Tes cepat
- `curl -vk https://advisor.<IP>.sslip.io/api/chat`
- `curl -vk https://face.<IP>.sslip.io/check-registration/test`
  Harus dapat 200 OK (atau response dari aplikasi kamu).

## Opsi B — Nginx + Certbot

1) Install Nginx dan Certbot
- Ubuntu: `sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx`

2) Copy config
- Copy `ops/nginx/sslip.io.conf` ke `/etc/nginx/sites-available/sslip.io.conf`
- `sudo ln -s /etc/nginx/sites-available/sslip.io.conf /etc/nginx/sites-enabled/`
- `sudo mkdir -p /var/www/certbot`
- `sudo nginx -t && sudo systemctl reload nginx`

3) Ambil sertifikat
- `sudo certbot --nginx -d advisor.<IP>.sslip.io -d face.<IP>.sslip.io`
- Ikuti prompt. Certbot akan inject path sertifikat ke config dan reload Nginx.

4) Tes HTTPS seperti di atas.

## Update Frontend

1) Environment variable (production)
- Lihat contoh `/.env.prod.example`
- Set:
  - `REACT_APP_ADVISOR_API_URL=https://advisor.<IP>.sslip.io/api/chat`
  - `REACT_APP_FACE_RECOGNITION_URL=https://face.<IP>.sslip.io`

2) CSP sudah di-update
- File `src/projcet_frontend/public/.ic-assets.json5` sudah menambahkan host sslip.io di `connect-src`.

3) Build & deploy canister frontend
- Jalankan build sesuai alur proyekmu (Vite) lalu `dfx deploy` untuk frontend canister.

4) Uji dari UI
- Buka `public/api-tester.html` (yang sudah kita update sebelumnya) atau jalankan fitur di UI. Pastikan mode HTTPS.

## Firewall & port
- Pastikan port 80 dan 443 terbuka dari internet ke server reverse proxy.
- Pastikan backend hanya listen di localhost (127.0.0.1) jika reverse proxy berjalan di server yang sama, untuk keamanan.

## Alternatif cepat tanpa konfigurasi server
- Cloudflare Tunnel: jalankan tunnel dari server kamu, dapatkan URL `https://<random>.trycloudflare.com` dengan sertifikat valid, lalu jadikan itu endpoint di `.env`.
- ngrok: mirip, dapat subdomain ngrok yang sudah HTTPS. Kelemahan: bisa berubah-ubah kecuali berlangganan.

## FAQ
- “Bisa pakai IP langsung untuk HTTPS?” → Secara teknis bisa pakai self-signed cert dengan SAN=IP, tapi browser akan tidak trust dan frontend (di HTTPS) tetap akan blokir. Jadi pakai hostname sslip.io agar dapat cert trusted.
- “Kalau IP ganti?” → Ganti IP di hostname sslip.io di config Caddy/Nginx, update `.env.prod`, lalu reload reverse proxy.
