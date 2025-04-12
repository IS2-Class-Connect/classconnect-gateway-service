## Table of Contents

- [Description](#description)
- [Technologies](#technologies)
- [Project Setup](#project-setup)
- [Running the Project](#running-the-project)
- [Database Configuration](#database-configuration)
- [Using this Template](#using-this-template)
- [⚠️ Branch Protection Recommendation](#️-branch-protection-recommendation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Support](#support)
- [License](#license)
- [Code Style](#code-style)
- [Codecov](#Codecov)

## Description

This repository is a template for creating microservices for the Class-Connect application. It uses **NestJS**, **Prisma**, and **TypeScript** with a **package-layered architecture**. The template is intentionally minimal and ready to be customized for each specific microservice.

## Use
The gateway will reroute the client to the specified service. For example `GET /user/<uuid>` will call the user-service with `GET /user/<uuid>`.

## Firebase Auth
For this to work there must be a service account key in `src/firebase/` where the file is called `firebase-admin.json`.

## Endpoints
- `/user`
- `/education`

## Technologies

- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications.
- **Prisma**: A next-generation ORM for database management.
- **TypeScript**: A strongly typed programming language that builds on JavaScript.
- **Package-Layered Architecture**: A modular architecture pattern for better scalability and maintainability.

## Project Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **PostgreSQL** (default database, can be switched to MongoDB if needed)

### Installation

Clone the repository and install dependencies:

```bash
$ git clone <repository-url>
$ cd classconnect-base-service
$ npm install
```

## Running the Project

### Development Mode

```bash
$ npm run start
```

### Watch Mode

```bash
$ npm run start:dev
```

### Production Mode

```bash
$ npm run start:prod
```

## Database Configuration

By default, this template is configured to use **PostgreSQL**. You can modify the database configuration in the `prisma/schema.prisma` file to switch to **MongoDB** or another database if required.

To migrate the database schema:

```bash
$ npx prisma migrate dev
```

To generate Prisma client:

```bash
$ npx prisma generate
```

## Using this Template

You can create a new repository from this template by clicking the **"Use this template"** button on GitHub. After cloning, make sure to:

- Run `npm install` to install dependencies.
- Update the `.env.example` file and create your own `.env`.
- Initialize your own Prisma schema.
- Configure GitHub Actions if needed.

## ⚠️ Branch Protection Recommendation

After creating a new repository from this template, we recommend you:

1. Go to `Settings > Branches` in your GitHub repository.
2. Add a protection rule for the `main` branch:
   - ✅ Require status checks to pass before merging.
   - ✅ Require branches to be up to date.
   - ❌ Review requirement is optional.
   - ✅ Block direct pushes (recommended).

## Testing

This project uses **Jest** for unit testing. To run tests:

```bash
$ npm run test
```

To run tests with coverage:

```bash
$ npm run test:cov
```

Tests will automatically run on every push or pull request to `main` via GitHub Actions.

## Project Structure

```
src/
├── controllers/
├── services/
├── modules/
├── entities/
├── repositories/
├── main.ts
├── app.module.ts
prisma/
├── schema.prisma
.github/
└── workflows/
    └── ci.yml
```

## Support

This template is open source and licensed under the MIT license. Contributions and feedback are welcome.

## License

This project is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Code Style

We use **Prettier** and **ESLint** to maintain consistent code formatting and quality. Use the following commands:

- To check and fix lint issues:

```bash
$ npm run lint
```

- To format files using Prettier:

```bash
$ npm run format
```

- To check formatting without making changes:

```bash
$ npm run format:check
```

## Codecov
[![codecov](https://codecov.io/github/IS2-Class-Connect/classconnect-gateway-service/graph/badge.svg?token=BCK7LDHO8U)](https://codecov.io/github/IS2-Class-Connect/classconnect-gateway-service)
