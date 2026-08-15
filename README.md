# Domaine Seetloo — Booking Portal

An internal booking portal for Domaine Seetloo, a wedding venue in Mauritius with two
rentable spaces (**Hall** and **Chalet**). Replaces a paper diary that once led to the
same date being double-booked to two different customers. Staff log bookings here
instead; the app rejects any booking that overlaps an existing one on the same venue,
and prints a confirmation form matching the venue's original paper layout.

Built by M. Seetloo.

## Features

- **Conflict-proof booking** — every booking is broken into occupancy blocks (the
  overall stay window, plus each named event line like Geet Gawai / Haldi / Reception)
  and checked for venue+time overlaps against every other confirmed booking, both live
  as staff type and authoritatively on save (inside a database transaction, so two
  staff sessions can't race each other into a double-booking).
- **Flexible event schedule** — each booking can have any number of named events
  (from a preset list or free text), each with its own date, time, and venue
  (Hall / Chalet / Both).
- **Payments** — Agreed Price and Deposit captured at booking time; an itemized
  payment log tracks installments, with the outstanding balance always derived live.
- **Print-faithful confirmation** — a printable page that mirrors the venue's original
  paper form (same fields, terms, and signature lines), auto-filled from the booking.
- **Single staff login** — no public-facing booking form; only logged-in staff create
  or edit bookings.

## Tech stack

Next.js (App Router, TypeScript) · Prisma + SQLite (via the `better-sqlite3` driver
adapter) · Tailwind CSS · `iron-session` for auth · `zod` + `react-hook-form` ·
`vitest` for the conflict-engine test suite.

## Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

- `DATABASE_URL` — defaults to `file:./dev.db`, fine for local dev.
- `ADMIN_PASSWORD_HASH` — generate with:
  ```bash
  node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
  ```
  **Escape every `$` in the generated hash as `\$`** before pasting it into `.env` —
  otherwise Next's env loader (`dotenv-expand`) will try to interpret `$2b`, `$10`,
  etc. as variable references and silently strip them, breaking login.
- `SESSION_SECRET` — a random 32+ byte string:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

Then set up the database and start the app:

```bash
npx prisma migrate dev
npx prisma db seed   # optional: loads 3 sample bookings mirroring the original paper forms
npm run dev
```

Open http://localhost:3000 and log in with the password you hashed above.

## Testing

```bash
npm test
```

Runs the conflict-detection engine's unit test suite (`src/lib/conflicts.test.ts`) —
same-venue overlap, the `BOTH` venue case, back-to-back bookings, midnight-crossing
events, stay-window-only conflicts, cancelled-booking exclusion, and self-exclusion
when editing a booking. This is the highest-risk logic in the app (it's the whole
reason the app exists), so it has dedicated automated coverage separate from manual
testing.

## Architecture notes

- **Dates/times are plain strings** (`"YYYY-MM-DD"`, `"HH:mm"`), never native `Date`
  objects, everywhere in the domain model. Mauritius is UTC+4 with no DST; running
  these through `Date`/Prisma `DateTime` would risk silent timezone drift on exactly
  the data this app exists to get right. Zero-padded strings in this format sort and
  compare correctly as plain strings — see `src/lib/dateUtils.ts` and the comment atop
  `src/lib/conflicts.ts`.
- **Conflict detection** lives in `src/lib/conflicts.ts`, split into pure functions
  (`buildOccupancyBlocks`, `venueOverlaps`, `timeOverlaps`, `findConflictsAmong`) with
  no database dependency, plus a thin `findConflicts` wrapper that fetches confirmed
  bookings and optionally runs inside a Prisma `$transaction` for atomic check-then-write.
- **Server Actions** (`src/actions/*.ts`) are the only way the UI mutates data —
  no separate REST/API layer.
- Cancelling a booking (`status: CANCELLED`) is soft — it's excluded from conflict
  checks (freeing its venue/dates) but never deleted, keeping the record for reference.

## Deployment (AWS)

This app ships a plain SQLite file, so it needs a machine with persistent local disk —
that rules out serverless platforms (Lambda, Vercel's default runtime) unless paired
with a hosted SQLite service. The simplest fit for a single-venue internal tool is one
small **EC2 instance**.

### Infrastructure (Terraform)

`terraform/` provisions everything: the EC2 instance, a security group (SSH only,
restricted to a CIDR you pass in), an SSH key pair (private key written locally,
gitignored), an S3 bucket for backups, and an IAM role/instance profile scoped to
`s3:PutObject` on that bucket only — no static AWS credentials ever live on the box.

```bash
cd terraform
terraform init
terraform plan -var="allowed_ssh_cidr=$(curl -s https://checkip.amazonaws.com)/32" -out=tfplan
terraform apply "tfplan"
```

Review the plan before applying — it creates real, billable resources (though within
Free Tier limits for a new AWS account: a `t3.micro`'s 750 free hours/month covers
running it continuously, the 15GB root volume is under the 30GB free allowance, and
the Elastic IP is free while attached to a running instance).

Outputs include `ssh_command` and `instance_public_ip`.

### App setup on the instance

1. **Install Node.js 24, git, and the `sqlite3` CLI** (used by the backup script for
   consistent snapshots):
   ```bash
   sudo dnf install -y git sqlite gcc-c++ make python3
   curl -fsSL https://rpm.nodesource.com/setup_24.x | sudo bash -
   sudo dnf install -y nodejs
   ```
2. **Add swap before building.** A `t3.micro` only has ~1GB RAM and Amazon Linux 2023
   ships with none by default — `next build` (Turbopack) will OOM-kill the SSH session
   partway through without it. Do this before the first build, not after debugging a
   mysteriously dead SSH connection:
   ```bash
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
   ```
3. **Get the code onto the instance** — `git clone <your-repo-url>` once it's pushed
   somewhere reachable from the instance; until then, tar the working directory
   locally (excluding `node_modules`, `.next`, `.git`, `*.db`, `terraform/`, `.env`)
   and `scp` it over.
4. **Install dependencies and generate the Prisma client:**
   ```bash
   cd domaine-seetloo-booking
   npm install
   npx prisma generate
   ```
5. **Set environment variables** — create `.env` on the server the same way as local
   setup, with a real password hash and a freshly generated `SESSION_SECRET` (don't
   reuse the local dev values). Easiest done by writing the file locally and `scp`ing
   it over, rather than typing secrets into a remote shell command where your local
   shell might try to interpret the `$` characters in the bcrypt hash before it ever
   reaches the server.
6. **Run migrations and build:**
   ```bash
   npx prisma migrate deploy
   npm run build
   ```
   Do **not** run `npx prisma db seed` in production — that loads the 3 fake sample
   bookings used for local development/demos.
7. **Run it under a process manager** so it restarts on crash/reboot — PM2:
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name domaine-seetloo -- start
   pm2 save
   sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
   ```
8. **Public access — Nginx + Let's Encrypt.** The security group opens 80/443
   (see `terraform/main.tf`) once you point a domain's A record at the instance's
   Elastic IP. Then, on the instance:
   ```bash
   sudo dnf install -y nginx
   sudo systemctl enable --now nginx
   sudo dnf install -y python3-pip
   sudo python3 -m pip install certbot certbot-nginx
   ```
   Add an Nginx server block proxying to `localhost:3000` (see
   `/etc/nginx/conf.d/domaineseetloo.conf` on the running instance for the exact
   config used in production), then:
   ```bash
   sudo certbot --nginx -d <your-domain> --agree-tos -m <your-email> --redirect
   ```
   Certbot's `pip`-installed version does **not** register a systemd timer for
   auto-renewal the way the OS package would — add a daily cron job by hand:
   ```bash
   echo '0 3 * * * /usr/local/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"' | sudo crontab -
   ```
   Until DNS/Nginx is set up, or as a fallback, you can always reach the app
   directly over SSH:
   ```bash
   ssh -N -L 3001:localhost:3000 -i terraform/domaine-seetloo-booking-key.pem ec2-user@<instance-ip>
   # then open http://localhost:3001
   ```

### Database backups

`scripts/backup-db.sh` snapshots the SQLite file (via `sqlite3 .backup`, so it's
always transactionally consistent even mid-write) and uploads it to S3 with a
timestamped key. The bucket and the instance's IAM permissions are already created
by Terraform (see above) — no static AWS credentials needed, the instance profile
handles auth. Just wire up cron on the instance:

```bash
sudo dnf install -y cronie
sudo systemctl enable --now crond
chmod +x ~/domaine-seetloo-booking/scripts/backup-db.sh
(crontab -l 2>/dev/null; echo '0 2 * * * DB_PATH=/home/ec2-user/domaine-seetloo-booking/dev.db S3_BUCKET=<your-bucket-name-from-terraform-output> /home/ec2-user/domaine-seetloo-booking/scripts/backup-db.sh >> /var/log/domaine-seetloo-backup.log 2>&1') | crontab -
```

Worth running the script manually once right after setup to confirm the IAM
permissions actually work, rather than waiting until 2am to find out:

```bash
DB_PATH=~/domaine-seetloo-booking/dev.db S3_BUCKET=<bucket-name> ~/domaine-seetloo-booking/scripts/backup-db.sh
```

## Project structure

```
prisma/            Schema, migrations, seed data
src/app/            Routes (login, dashboard, booking create/view/edit/print)
src/actions/         Server Actions — the only mutation/query layer the UI calls
src/components/      React components, grouped by feature
src/lib/             Domain logic: conflicts.ts, dateUtils.ts, validation.ts, auth.ts
scripts/             Ops scripts (database backup)
terraform/            AWS infrastructure as code (EC2, security group, S3 backups bucket, IAM)
```
