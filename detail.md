TECHNICAL ARCHITECTURE REPORT: IOT SMART PARKING SYSTEM

This report provides a detailed breakdown of the "Sajilo Swasthya" Smart Parking System, covering security, access control, user management, and the simulation layer.

1. AUTHENTICATION AND SECURITY FLOW
The system uses a modern security method called JWT (JSON Web Tokens).

- Login Process:
When an Admin or Staff logs in, they send their email and password. The backend checks the password against a secure "hash" (an encrypted version) stored in the database. If it matches, the backend sends back a unique digital key (the JWT). The browser saves this key and sends it automatically with every future request to prove who the user is.

- Password Reset Flow:
If a user forgets their password, they enter their email. The system generates a secret temporary code and saves it in the database for 24 hours. An email is sent to the user with a link containing this code. When the user clicks the link, they can set a new password. The system then deletes the temporary code so it can't be used again.

2. ROLE-BASED ACCESS CONTROL (RBAC)
The system has a clear hierarchy to keep data safe.

- Admin Role:
The Admin is the "Superuser." They can see everything, including total money earned (revenue analytics), and they are the only ones who can add or delete other staff members.

- Operator Role (Staff):
Staff members can manage the daily parking. They can see which slots are full, register new customers, and handle payments. They cannot see the overall financial reports or manage other staff accounts.

- Technical Check:
Every time someone clicks a button, a "Middleware" function in the background checks their digital key to see if they have the right permission (Admin or Operator) before letting the action happen.

3. USER AND MEMBER MANAGEMENT
The system allows staff to register "Members" who get special benefits.

- Registration:
When a new customer is added, the system creates a unique 16-character code for them.
- QR Code:
This unique code is converted into a QR Image. The customer can download this image or receive it via email. This QR code acts as their "Digital Identity Card."
- Loyalty Points:
Every time a member pays for parking, the system automatically gives them points (for example, 1 point for every 10 rupees spent). These points are stored in the database and can be used for future discounts.

4. IOT SIMULATION LAYER (THE DIGITAL TWIN)
Instead of using physical hardware like wires and sensors right now, we use a Python program that acts exactly like the hardware.

- How it works:
The simulator calculates a "virtual distance." If an object is closer than 20cm, it assumes a car has parked and sends an "Occupied" message. if the object moves away, it sends an "Available" message.
- Communication:
It sends these messages using a protocol called MQTT, which is like a walkie-talkie for machines.
- Benefit:
This allows us to build and test the entire software system (the website, the database, the billing) perfectly. When we buy the real ESP32 sensors later, we just plug them in and they will work with the system immediately.

5. LIVE DATA SYNCHRONIZATION
The system updates instantly without needing to refresh the page.

- The Process:
When a car parks, the simulator sends a message to the backend. The backend updates the database and then immediately "shouts" the update to all open browsers using a technology called Socket.IO.
- The Result:
The parking slot on the website turns red or green instantly. This ensures the staff always sees the exact status of the parking lot in real-time.
