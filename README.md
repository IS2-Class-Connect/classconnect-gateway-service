## Table of Contents

- [Description](#description)
- [Technologies](#technologies)
- [Project Setup](#project-setup)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [License](#license)
- [Code Style](#code-style)
- [Codecov](#Codecov)

## Description

This repository has the implementation of the gateway server for the ClassConnect application. It redirects requests to the correct microservice and has some extra features such as push notification handling and email delivery. It uses **NestJS** and **TypeScript**.

The gateway will reroute the client to the specified service. For example `GET /users/<uuid>` will call the users-service with `GET /users/<uuid>` and return it's response to the user.

## Use

## Endpoints

Here are some curl examples for gateway specific endpoints.

To send a push notifiation use `POST /notifications`
```sh
curl -X 'POST' 'http://localhost:3000/notifications' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "uuid":  "user id",
    "title": "notification title",
    "body":  "body of notification",
    "topic": "the topic of the notification"
  }'
```

To send a student enrollment mail use `POST /email/student-enrollment`.
```sh
curl -X 'POST' 'http://localhost:3000/email/student-enrollment' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "uuid":         "user id",
    "toName":       "recipient name",
    "courseName":   "name of the enrolled course",
    "studentEmail": "the email of the recipient",
    "topic":        "enrollment"
  }'
```

To send an assistant assignment mail use `POST /email/assistant-assignment`.
```sh
curl -X 'POST' 'http://localhost:3000/email/assistant-assignment' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "uuid":          "user id",
    "toName":        "recipient name",
    "professorName": "name of the professor in charge of the course",
    "courseName":    "the name of the course",
    "studentEmail":  "the email of the recipient",
    "topic":         "assistant-assignment"
  }'
```

To send a new rules and policies mail use `POST /email/rules`.
```sh
curl -X 'POST' 'http://localhost:3000/email/rules' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "rules": [
      {
        "title": "the title of the rule",
        "description": "a description of this rule",
        "effective_date": "the date which the rule becomes relevant",
        "applicable_conditions": [
          "cond1",
          "cond2"
        ]
      }
    ]
  }'
```

To talk to the gateway through the backoffice use the path `/admin-backend/*`. For example this retrieves all the users.
```sh
curl 'http://localhost:3000/users' \
  -H 'Authorization: Bearer {token}'
```

To get a user without passing it's id use `GET /users/me`.
```sh
curl 'http://localhost:3000/users/me' \
  -H 'Authorization: Bearer {token}'
```

To patch a user without passing it's id use `PATCH /users/me`.
```sh
curl -X 'PATCH' 'http://localhost:3000/users/me' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "new name",
    "email": "new email",
    "description": "new description"
  }'
```

## Technologies

- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications.
- **TypeScript**: A strongly typed programming language that builds on JavaScript.
- **Package-Layered Architecture**: A modular architecture pattern for better scalability and maintainability.

## Project Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)

### Installation

Clone the repository and install dependencies:

```bash
$ git clone <repository-url> gateway
$ cd gateway
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
.github/
└── workflows/
    └── ci.yml
src/
├── auth/
├── config/
├── controllers/
├── services/
├── firebase/
└── main.ts
test/
```

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
