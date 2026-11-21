# ADR 0002: Relational Data Store and Migrations (PostgreSQL & SQLAlchemy/Alembic)

- **Status**: Accepted
- **Date**: 2026-11-21
- **Deciders**: StudySphere Engineering Team

## Context
StudySphere requires strict relational integrity (UUID foreign keys, group membership rules, cascade deletions, note sharing permissions, audit logs). A database with strong ACID guarantees and migration tracking is required.

## Decision
We select **PostgreSQL** as the primary relational database for production/container environments and **SQLAlchemy 2.0** with **Alembic** for schema migrations and data access. For local zero-dependency testing and environments where a local PostgreSQL instance is not yet running, SQLite is supported via configurable `DATABASE_URL`.

## Alternatives Considered
- **MongoDB / NoSQL**: Rejected due to weak relational integrity guarantees for multi-entity permission checks (users, groups, memberships, permissions).
- **Raw SQL without migrations**: Rejected to ensure repeatable migrations across local and deployed environments.

## Consequences
- **Positive**:
  - Enforced unique constraints (email, group membership).
  - Explicit indexes on foreign keys and frequently queried fields.
  - Reproducible schema versioning via Alembic.
