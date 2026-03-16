# demo-fresh-orders-api

Demo Orders API repository for Postman API Catalog and Insights.

## Purpose

This repository represents a lightweight service used to demonstrate:

- Postman API Catalog integration
- Postman Insights runtime traffic
- GitHub repository linkage
- CI/CD metadata and documentation

## Endpoints

- `GET /orders`
- `POST /orders`

## Files

- `openapi.yaml`: OpenAPI definition
- `postman_collection.json`: Postman collection for the service
- `src/server.js`: Minimal local stub

## Notes

The Kubernetes demo cluster uses a JSON-backed mock implementation for runtime traffic generation.
