# Orders API catalog observability

This change exercises the pull-request delivery path used by the Postman API Catalog. The PR runs the generated smoke and contract suites and publishes branch, commit, author, workflow, and pull-request context alongside the collection results.

Runtime request totals, latency, errors, and service dependencies are supplied separately by a Postman Insights Agent observing the deployed service.
