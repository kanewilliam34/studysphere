# ADR 0001: Modular Monolith Backend Architecture

- **Status**: Accepted
- **Date**: 2026-11-21
- **Deciders**: StudySphere Engineering Team

## Context
StudySphere requires accounts, study groups, real-time messaging, AI tutoring, and private notes sharing across Web and Mobile clients. Designing with distributed microservices upfront introduces high network latency, deployment overhead, distributed transaction complexity, and increased hosting costs, conflicting with the zero-budget and rapid iteration goals.

## Decision
We adopt a **modular monolith** using Python and FastAPI. The backend is structured into domain modules (`auth`, `groups`, `chat/nexconn`, `ai`, `notes`, `audit`) within a single deployable service. Each module maintains clean boundaries via repositories and services, decoupling database access and business logic.

## Alternatives Considered
- **Microservices**: Defer until transaction volume or distinct team boundaries require decoupled deployments.
- **Serverless functions**: Would introduce cold start latency and fragmented state management for database connections and local background processes.

## Consequences
- **Positive**:
  - Simplified local development and single container deployment.
  - In-process transactions and clear module boundaries.
  - Zero-cost local hosting and easy debugging.
- **Negative / Trade-offs**:
  - Developers must enforce module encapsulation to avoid tight coupling.
  - Scaling requires scaling the entire application instance unless split later.
