# Orvio Clinic Portal (MVP)

Clinic + pharmacy portal (no patient accounts) for **in-person kiosk signing** on iPad/laptop.

## MVP features (already wired)
- Secure login (cookie + JWT, password hashed)
- RBAC roles: Clinic Admin/Staff + Pharmacy Admin/Staff
- Patients CRUD (create + list + view)
- Cases (one case = one enrollment bundle)
- Structured clinical fields stored in DB (dx, drug, eye, insurance, comm prefs)
- Start signing (currently `mock` provider completes instantly and stores reference files)
- Store docs + download with RBAC
- Mark case as faxed (manual workflow)
- Audit events for signing/faxing

## Run locally

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open: http://localhost:3000

Demo accounts:
- clinic.admin@example.com / changeme
- pharmacy.admin@example.com / changeme

## DocuSign sandbox (next step)
See `docs/docusign.md` for the exact implementation plan:
- patient signs first (in-person signing)
- doctor signs second (embedded signing; signature adoption)
