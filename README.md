# Project Black Vault

⚡ Takes 2 minutes to set up. No coding required.

A self-hosted firearms and gear management platform to track inventory, ammo, maintenance, and performance — all stored securely on your own system.

---

## 🚀 Quick Start (Recommended)

Run the app in minutes using Docker.

### 1. Install Docker

Download Docker Desktop: https://www.docker.com/products/docker-desktop/

---

### 2. Clone the repo

```bash
git clone https://github.com/theaveragedeveloper/ProjectBlackVault.git
cd ProjectBlackVault
```

---

### 3. Start the app

```bash
docker compose up -d
```

---

### 4. Open the app

Go to: http://localhost:3000

---

## 🤖 Need Help Installing?

Copy and paste this into ChatGPT:

```
I have zero coding experience and want to install this app:

https://github.com/theaveragedeveloper/ProjectBlackVault

My goal:
- Run it on my computer or home server
- Be able to access it from my phone
- Keep everything local and private

Please walk me through this step-by-step like I'm a beginner.

Important:
- Assume I've never used Docker before
- Be extremely clear and simple
- Give me exact commands to copy and paste
- Help me find my local IP so I can access it on my phone
- Help troubleshoot if something doesn't work

Start from the very beginning.
```

---

## 📱 Access From Your Phone

If running on your home server or computer:

1. Find your local IP address (example: `192.168.1.202`)
2. Open on your phone:

```
http://YOUR_LOCAL_IP:3000
```

Example:

```
http://192.168.1.202:3000
```

---

## 🔒 Security

- Fully self-hosted
- Your data stays on your machine
- No cloud account required
- No tracking or data collection

---

## 🧰 Features

### Inventory
- Track firearms and gear
- Store serial numbers and valuations
- Add images to each item

### Ammo
- Track inventory by caliber, brand, and type
- Monitor usage over time
- Low stock awareness

### Maintenance
- Round count tracking
- Cleaning and service reminders
- Battery replacement alerts

### Performance
- Log range sessions
- Track drill performance over time

### Tools
- Hit factor calculator
- Basic ballistics calculator (DOPE cards)
- Export inventory for insurance or records

---

## 🛠 Troubleshooting

If the app doesn't load:

- Make sure Docker is running
- Make sure port 3000 is not in use

Restart everything:

```bash
docker compose down
docker compose up -d
```

---

## 🔄 Updating to a New Version

```bash
docker compose pull
docker compose up -d
```

Your data is preserved automatically.

---

## 🧪 Local Development (Advanced)

Only needed if you want to modify the app.

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

## ⚠️ Notes

- This is a self-hosted application
- You are responsible for your own backups
- No external services are required

---

## 🧠 Why Black Vault?

Most tools are either:
- Spreadsheets
- Notes apps
- Or cloud platforms

Black Vault gives you:
- Full control
- Structured tracking
- Zero reliance on third parties
