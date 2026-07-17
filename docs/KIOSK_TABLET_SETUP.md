# Kiosk Tablet Setup Guide

## Hardware Requirements

| Item | Recommendation |
|---|---|
| Tablet | Samsung Galaxy Tab A8 or A9 (10.5") |
| SIM | Prepaid 5G SIM (T-Mobile or Verizon) |
| Mount | Heavy-duty wall or bay mount |
| Power | Continuous power supply (no battery drain) |

---

## Step 1: Flash and Prepare the Tablet

1. Perform a **factory reset** on the tablet (Settings → General Management → Reset).
2. Skip Google account setup during initial boot (tap "Skip" on all prompts).
3. Connect to the dealership Wi-Fi **or** insert the prepaid 5G SIM.
4. Go to **Settings → Display** and set:
   - Screen timeout: **Never** (or maximum)
   - Brightness: **80%**
5. Go to **Settings → Developer Options** (tap Build Number 7 times) and enable **Stay Awake**.

---

## Step 2: Install Fully Kiosk Browser

1. Open the Play Store and search for **"Fully Kiosk Browser"**.
2. Install and open the app.
3. Accept all permissions (camera, microphone, storage).

---

## Step 3: Configure Fully Kiosk Browser

Open Fully Kiosk → **Settings** and configure:

### Web Content
| Setting | Value |
|---|---|
| Start URL | `https://yourdomain.com/kiosk/{DEPARTMENT_ID}` |
| Homepage URL | Same as Start URL |
| Load Start URL on App Start | ✓ Enabled |

### Kiosk Mode
| Setting | Value |
|---|---|
| Enable Kiosk Mode | ✓ Enabled |
| Kiosk Mode Password | Set a PIN (e.g., `1234`) |
| Allow Home Button | ✗ Disabled |
| Allow Recent Apps Button | ✗ Disabled |
| Show Navigation Bar | ✗ Disabled |

### Display
| Setting | Value |
|---|---|
| Keep Screen On | ✓ Enabled |
| Screen Brightness | 80% |
| Prevent Sleep While Plugged In | ✓ Enabled |

### Advanced Web Settings
| Setting | Value |
|---|---|
| Enable JavaScript | ✓ Enabled |
| Allow Geolocation | ✓ Enabled |
| Allow Camera Access | ✓ Enabled |
| Allow Microphone Access | ✓ Enabled |

---

## Step 4: Inject the Kiosk Token

The kiosk page requires a long-lived authentication token. To inject it:

1. In Fully Kiosk, go to **Settings → Advanced Web Settings → Inject JavaScript**.
2. Paste the following (replace `YOUR_KIOSK_TOKEN` with the token from the Admin → Kiosk Setup page):

```javascript
localStorage.setItem('lw_kiosk_token', 'YOUR_KIOSK_TOKEN');
```

3. Save and reload the page. The kiosk should now show the department's open issues.

> **Tip:** Generate the kiosk token from the admin panel at **Admin → Kiosk Setup**, select the department, and copy the token. Tokens are valid for 1 year.

---

## Step 5: Mount the Tablet

1. Install the wall or bay mount in a visible location in the service bay.
2. Plug the tablet into continuous power.
3. Attach the tablet to the mount.
4. Verify the screen shows the correct department's open issues.

---

## Step 6: Test the Kiosk

1. From the lot walkthrough app, create a test issue routed to this department.
2. Verify the issue appears on the kiosk within 30 seconds (auto-refresh).
3. Tap the issue card, select a technician name, and tap **Mark Complete**.
4. Verify the issue disappears from the list.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Screen shows login page | Re-inject the kiosk token (Step 4) |
| Issues not refreshing | Check Wi-Fi/SIM signal; page auto-refreshes every 30s |
| "No open issues" when there are issues | Verify the correct `department_id` is in the URL |
| Tablet exits kiosk mode | Re-enable Kiosk Mode in Fully Kiosk settings |
| Token expired | Generate a new token from Admin → Kiosk Setup |
