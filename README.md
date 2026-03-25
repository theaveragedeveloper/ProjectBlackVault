# BlackVault

A self-hosted, local-only web app for tracking firearms, accessories, and range sessions. All data stays on your machine.

---

## Screenshots

<!-- screenshot: dashboard -->
<!-- screenshot: vault -->
<!-- screenshot: range-session -->
<!-- screenshot: drill-library -->

---

## Features

- Firearm and accessory tracking
- Document uploads
- Range sessions and drills
- Drill library and history
- Drill logging (standalone or tied to a session)
- Drill performance tracking
- CSV and PDF export
- Dashboard
- Mobile access via local network

---

## Quick Start (Docker)

**Requirements:** [Docker](https://docs.docker.com/get-docker/) installed on your machine.

```bash
git clone https://github.com/theaveragedeveloper/ProjectBlackVault.git
cd ProjectBlackVault
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Simple Setup (Non-Technical)

1. Install Docker: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
2. Go to the GitHub repository page and click **Code → Download ZIP**
3. Extract the ZIP to a folder on your computer
4. Open a terminal (Command Prompt on Windows, Terminal on Mac) and navigate to that folder
5. Run: `docker compose up --build`
6. Open your browser and go to `http://localhost:3000`

BlackVault will be running and ready to use.

---

## Mobile Access (Same Network)

You can open BlackVault on your phone as long as it is on the same Wi-Fi network as your computer.

1. Open BlackVault in your browser and go to **Settings**
2. The Settings page will detect your local IP automatically and display a QR code
3. Scan the QR code with your phone, or open `http://192.168.x.x:3000` (using your machine's local IP)

To find your local IP manually: run `ipconfig` on Windows or `ip addr` on Linux/Mac.

---

## Notes

- BlackVault is self-hosted. All data is stored locally on your machine.
- No cloud connection is required or used.
- There is no login or authentication in V1.
- Intended for private, local use only. Do not expose it to the public internet.

---

## Local Development

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## License

MIT License. See [LICENSE](LICENSE) for details.
