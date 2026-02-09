# DocuSign (Sandbox) wiring plan — Patient first, Doctor second

This app is built **DocuSign-ready** but ships with a `MockESignProvider` so you can move fast.

## Your requirements (implemented by design)
- No patient accounts.
- **In-person kiosk signing** on iPad/laptop.
- **Patient signs first**, then **doctor signs second**.
- Each doctor has their own DocuSign user.
- Canada data residency (you must provision DocuSign + your hosting in Canada).

## Step 1 — Create a DocuSign Developer account
1. Sign up for DocuSign Developer (sandbox).
2. Create an Integration Key (Client ID).
3. Configure JWT or Authorization Code grant.

> NOTE: We will implement JWT for server-to-server. You will need:
> - Integration Key
> - User ID (per doctor)
> - Account ID
> - RSA private key

## Step 2 — Create 3 templates (FR first)
Templates to create in DocuSign:
1. Eye-Q/NOW Enrollment (FR)
2. Pharmacy consent (convert your DOCX to PDF for best template behavior)
3. Prescription (FR)

Each template should have:
- Tabs for structured fields (we will prefill from DB)
- One required patient signature tab (kiosk)
- Doctor signature tab (embedded)

## Step 3 — Recipient routing (recommended)
Envelope has 2 recipients:

### Recipient 1: In-person signer (PATIENT)
- Use DocuSign **in-person signing** (host = clinic user, signer = patient on device)
- Patient fills/acknowledges required patient fields + signs once

### Recipient 2: Doctor (DOCTOR)
- Use **embedded signing** (recipient view) so the doctor signs in your portal
- DocuSign signature adoption means their signature is re-used (1 tap)

## Step 4 — Implementation TODOs in code
- Implement `DocusignESignProvider` in:
  - `src/server/esign/docusign.ts`
- Update `getESignProvider()` to use it when `ESIGN_PROVIDER=docusign`
- Add DocuSign webhook endpoint:
  - `src/app/api/docusign/webhook/route.ts` (not yet created)

## Step 5 — Persist signed docs
On envelope completion:
- Download completed documents (combined or separate PDFs)
- Store them using StorageDriver (`local` now; `s3` later)
- Create `Document` rows and set `Case.status = SIGNED`

## Where you fill things in
- `.env` docuSign values
- Doctor user records: set `User.docusignUserId`

