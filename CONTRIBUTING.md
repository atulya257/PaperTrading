# Contributing

Thanks for your interest in TradeLab. It is a student project, so contributions are welcome but reviewed with the project's learning goals in mind.

## Before you start

- For anything larger than a small fix, open an issue first to discuss the change.
- Set up the project with [docs/SETUP.md](docs/SETUP.md) and read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) to see where your change belongs.

## Making a change

1. Create a branch from `main` with a short descriptive name, for example `fix-limit-order-rounding`.
2. Keep the change focused on one thing.
3. Follow the existing style:
   - **React:** function components and hooks, plain CSS next to each component, colours and sizes from `src/styles/tokens.css` (they must work in light and dark mode).
   - **Trading rules:** keep them in `src/engine/` as plain functions.
   - **Spring Boot:** keep the controller → service → repository layers. Put business rules in the service class and return errors in the service's existing JSON format.
   - **Secrets:** never commit passwords or keys. Use environment variables.
4. Run the checks before opening a pull request:

   ```powershell
   npm run lint
   npm run build
   cd services\stock-service; .\mvnw.cmd test
   cd services\user-service;  .\mvnw.cmd test
   ```

   Run `cd backend-monolith; .\mvnw.cmd test` too if you changed the monolith.

5. Update the documentation if you change an endpoint, a table, a setting or the setup steps.

## Commit messages

Write a short summary in the imperative ("Add sector filter to the Stock Service"), and explain the reason in the body when it is not obvious.

## Pull requests

Fill in the pull request template: describe what changed and why, how you tested it, and include screenshots for visible UI changes.

## Reporting bugs

Use the bug report template. Include the steps to reproduce it, what you expected and what happened, and which part was affected (React app, Stock Service, User Service or the monolith).
