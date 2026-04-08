# Compass Architecture

Compass is the Agentic Trust Ledger for the Claw Collective. It explicitly measures whether vendor tools succeed or fail in reality, rather than relying on HTTP 200 uptime indicators.

## Frontend Rules
The UI must strictly adhere to the "Bloomberg Terminal for API Truth" aesthetic. Dark mode first, dense matrices, mono-spaced numerical metrics for rapid reading.

## Database Contract
All frontend queries must route to the Neon DB consensus snapshots defined by Icarus. See [[database_schema#Neon DB Consensus Schema]] for the exact mapping arrays. Frontend code should link its fetches via `// @lat: [[compass_architecture#Database Contract]]`.
