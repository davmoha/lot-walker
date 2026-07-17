# New Dealership Onboarding Checklist

**Target:** Fully operational within 30 minutes of signup.

---

## Pre-Onboarding (Super Admin — 5 min)

- [ ] Log in to Lot Walker as **Super Admin**
- [ ] Navigate to **Companies** → **Create Company**
- [ ] Fill in:
  - [ ] Business Name (e.g., "Sunrise Auto Group")
  - [ ] Dealer Code (unique short code, e.g., `SUNRISE`)
  - [ ] Contact Email and Phone
  - [ ] Logo URL (optional — can be added later)
- [ ] Click **Save**
- [ ] Click **Manage Users** for the new company
- [ ] Create the **Company Admin** user:
  - [ ] Name, email, password
  - [ ] Role: `company_admin`
- [ ] Send login credentials to the dealer's admin contact

---

## Admin Setup (Company Admin — 10 min)

### Departments
- [ ] Log in as Company Admin
- [ ] Go to **Admin → Departments**
- [ ] Add each department with its notification email:
  - [ ] Service (e.g., `service@dealership.com`)
  - [ ] Body Shop (e.g., `bodyshop@dealership.com`)
  - [ ] Detail (e.g., `detail@dealership.com`)
  - [ ] Parts (e.g., `parts@dealership.com`)
  - [ ] *(Add any additional departments)*

### Technicians
- [ ] Go to **Admin → Technicians**
- [ ] Add each technician:
  - [ ] Name
  - [ ] Assign to department
  - [ ] Set Active = Yes

### Staff Users
- [ ] Go to **Admin → Users**
- [ ] Add lot walkers / employees:
  - [ ] Name, email, password
  - [ ] Role: `employee`

---

## Inventory Import (Company Admin — 5 min)

- [ ] Export current inventory from DMS (CDK, Reynolds, etc.) as CSV
- [ ] Go to **Admin → CSV Import**
- [ ] Upload the CSV file
- [ ] Review the auto-detected column mapping
- [ ] Confirm the mapping
- [ ] Verify import results (records upserted, any errors)

---

## Kiosk Setup (Per Department — 5 min each)

For each department that needs a kiosk tablet:

- [ ] Go to **Admin → Kiosk Setup**
- [ ] Select the department
- [ ] Click **Generate Kiosk Token**
- [ ] Copy the Kiosk URL and Token
- [ ] Follow the [Kiosk Tablet Setup Guide](./KIOSK_TABLET_SETUP.md)
- [ ] Verify the kiosk displays open issues for the correct department

---

## First Lot Walkthrough (Employee — 5 min)

- [ ] Open `https://yourdomain.com` on a mobile phone
- [ ] Log in with employee credentials
- [ ] Navigate to **Lot Walkthrough**
- [ ] Tap **Start Camera**
- [ ] Scan a VIN barcode on a vehicle
- [ ] Verify vehicle info appears
- [ ] Create a test issue (select a quick issue, choose a department)
- [ ] Tap **Save & Next**
- [ ] Verify the issue appears on the correct department's kiosk
- [ ] Verify the department notification email arrives

---

## Go-Live Verification

- [ ] At least one vehicle in inventory
- [ ] At least one department with notification email
- [ ] At least one technician assigned to each department
- [ ] At least one employee user can log in and scan
- [ ] Kiosk tablets are mounted, powered, and displaying issues
- [ ] Test issue created → email received → kiosk shows issue → tech closes it → report shows data

---

## Support

For technical issues, contact your Lot Walker administrator or refer to the documentation in the `/docs` folder of the repository.
