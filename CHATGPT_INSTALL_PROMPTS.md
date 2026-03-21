# ChatGPT Install Prompts (ProjectBlackVault V1)

Copy/paste one of the prompts below into ChatGPT.

## 1) Help Me Install This On My Home Server With Docker

```text
Help me install ProjectBlackVault V1 on my home server using Docker.

Important:
- Assume I am non-technical.
- Give exactly one step at a time.
- Wait for my confirmation before moving on.
- Ask me to copy/paste command output when needed.
- Use plain English for every instruction.

Install goals:
1) Confirm Docker is running.
2) In my ProjectBlackVault folder, create .env from .env.example.
3) Start with: docker compose up -d --build
4) Open http://localhost:3000
5) Complete first-time setup and login.
6) Enable local network access by setting BIND_ADDRESS=0.0.0.0 only when I confirm I want it.
7) Help me open the app from another device on the same network.

Safety:
- Do not ask me to run destructive commands.
- Explain any risky command before using it.
```

## 2) Help Me Update This App Safely

```text
Help me safely update ProjectBlackVault V1 (Docker install).

Important:
- Assume I am non-technical.
- Give one step at a time and wait for confirmation.
- Use plain English.

Update workflow:
1) Back up data/db, data/uploads, and .env first.
2) Verify backup is complete before any update.
3) Update app files in my existing project folder.
4) Run: docker compose up -d --build
5) Run: curl -fsS http://localhost:3000/api/health
6) Confirm data is intact after update.

If there is an error:
- Explain what failed in plain English.
- Give the safest recovery step first.
```

## 3) Help Me Back Up This App Before Making Changes

```text
Help me create a safe backup for ProjectBlackVault V1 before I make changes.

Important:
- Assume I am non-technical.
- Give one step at a time and wait for confirmation.
- Keep instructions short and plain.

Backup goals:
1) Stop app safely with Docker.
2) Back up these exact items together: data/db, data/uploads, and .env.
3) Verify the backup files exist and are readable.
4) Restart the app.
5) Confirm app still loads.

Also explain:
- Why .env matters.
- Why losing an encryption key can make encrypted fields unrecoverable.
```

## 4) Help Me Troubleshoot Why The App Is Not Loading On My Network

```text
Help me troubleshoot why ProjectBlackVault does not load from another device on my network.

Important:
- Assume I am non-technical.
- Give one step at a time.
- Wait for my confirmation each step.
- Ask for command output when needed.

Check in this order:
1) Confirm app loads on the server machine at localhost.
2) Confirm docker compose ps shows container running.
3) Confirm BIND_ADDRESS=0.0.0.0 in .env.
4) Restart with docker compose up -d --build.
5) Confirm I am using the correct server IP and port.
6) Confirm both devices are on the same network.
7) Check firewall blocking port 3000.
8) Review docker logs and explain errors in plain English.

Do not suggest data deletion.
```
