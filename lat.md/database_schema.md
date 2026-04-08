# Database Schema

This section outlines the strict backend schema structure for our Neon Postgres database.

## Neon DB Consensus Schema
The current backend is rewritten to support the Claims vs. Reality matrix. 

Following a rewrite, it expects a flattened JSON response detailing standard tracking outputs like Task Resolution, Silent Failures, and Vendor Deltas. Icarus owns the data shape written here. Awaiting exact JSON mapping from Icarus. Code writes should be tracked via `// @lat: [[database_schema#Neon DB Consensus Schema]]`.
