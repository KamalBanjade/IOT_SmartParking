# 🔧 Smart Parking — Troubleshooting Guide

---

## Issue 1: Slot not updating on dashboard

**Symptoms**: Car is present / sensor triggered, but slot stays green on the dashboard.

**Checks (in order):**
1. Is the simulator or ESP32 publishing to the correct topic?
   ```bash
   # Monitor ALL MQTT traffic
   mosquitto_sub -h localhost -t "#" -v
   ```
   You should see `parking/slots/1 {"slotId":1,"status":"occupied",...}`.

2. Is the MQTT broker running?
   ```powershell
   net start mosquitto
   ```

3. Did the backend subscribe on startup? Check backend console:
   ```
   [MQTT] Subscribed to: parking/slots/#
   ```

4. Is Socket.IO connected? Check the navbar — the dot should be **green** and say **Live**.
   - If it says "Reconnecting..." → the backend is down.
   - Run: `pm2 restart smart-parking-api`

---

## Issue 2: Duplicate sessions being created

**Symptoms**: A single slot entry creates multiple rows in `parking_sessions`.

**Causes & Fixes:**
- MQTT is firing `occupied` multiple times for the same event.
  - **Fix**: Increase `DEBOUNCE_READS` in ESP32 firmware from `3` to `5`.
- The `startSession` service is not idempotent for this slot.
  - **Fix**: Confirm `sessionService.js` checks for an existing active session before inserting.

---

## Issue 3: Khalti payment not returning to success page

**Symptoms**: User is redirected to Khalti, pays, but the `/payment/success` page shows an error.

**Checks:**
1. Is `FRONTEND_URL` in `.env` the exact URL the browser uses?
   - If backend has `FRONTEND_URL=http://localhost:5173` but user opens `http://192.168.1.5:5173`, the return URL will fail.
   - **Fix**: Set `FRONTEND_URL` to the actual LAN IP used to access the app.

2. Does `localStorage` have `pendingPayment` before the redirect?
   - Open DevTools → Application → Local Storage → check for `pendingPayment`.
   - If missing, the exit flow in `PaymentModal.jsx` didn't save it (check console errors).

3. Does `/payment/success` route exist in React Router?
   - Check `App.jsx` — the route `<Route path="/payment/success" element={<PaymentSuccessPage />} />` must be present.

---

## Issue 4: ESP32 not connecting to MQTT broker

**Symptoms**: Serial Monitor shows repeated "MQTT connecting..." without success.

**Checks:**
1. Is `MQTT_BROKER` the server's **LAN IP**, not `localhost` or `127.0.0.1`?
   ```cpp
   const char* MQTT_BROKER = "192.168.1.100"; // ✅ Correct
   const char* MQTT_BROKER = "localhost";      // ❌ Wrong — ESP32 cannot resolve this
   ```

2. Is Mosquitto listening on all interfaces (not just localhost)?
   ```conf
   listener 1883 0.0.0.0   # ✅ Required
   listener 1883            # ❌ Binds to 127.0.0.1 only
   ```

3. Is port 1883 open in Windows Firewall?
   - Open Windows Defender Firewall → Advanced Settings → Inbound Rules → New Rule → Port → TCP 1883.

4. Are the ESP32 and server on the **same WiFi network**?
   - Test: ping the server IP from another device on the same network.

---

## Issue 5: QR code not scanning with camera

**Symptoms**: Camera tab shows, but QR code is never detected.

**Fixes:**
1. Switch to the **Manual Input** tab as a fallback — enter the QR token directly.
2. Check that the browser has camera permission (browser address bar shows camera icon).
3. The browser camera API **only works on `localhost` or HTTPS**.
   - If accessing from a tablet/phone on LAN (e.g. `http://192.168.1.5:5173`), the camera will be blocked.
   - **Fix**: Either use `localhost` on the operator's machine, or set up HTTPS with a self-signed cert.

---

## Issue 6: Payment shows wrong amount

**Symptoms**: Amount is 0, or much higher/lower than expected.

**Checks:**
1. Is `PARKING_RATE_PER_HOUR` set in `.env`? Default is `30` NPR if missing.
2. Is `session.entry_time` being recorded correctly? Check `parking_sessions` table.
3. Does `calculateAmount()` in `paymentService.js` use `Math.ceil` for hours?
   - 45-minute stay → `Math.ceil(45/60) = 1` hour → 30 NPR. This is correct.
4. If timezone is wrong, `entry_time` may be off by hours — check `DB_HOST` timezone and `pg` timezone settings.

---

## Issue 7: PM2 not starting on Windows boot

**Symptoms**: After a reboot, PM2 processes are not running.

**Fix:**
```powershell
# 1. Run PM2 startup command
pm2 startup

# 2. Follow the exact command it outputs (copy/paste it)

# 3. Save current process list
pm2 save

# 4. Verify
pm2 list  # Should show your processes after reboot
```

> Note: On Windows, PM2 startup uses the Windows Service or Task Scheduler.
> Run PowerShell as Administrator when executing the startup command.
