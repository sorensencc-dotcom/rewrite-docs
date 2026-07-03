# BookStack Local Development Environment

This directory contains a standalone Docker Compose setup for running a local instance of BookStack.
It is primarily used for testing the `BookStackAdapter` integration without relying on a mocked server.

## Getting Started

To spin up the local BookStack instance, simply run:

```bash
docker compose up -d
```

The application will be accessible at:
**http://127.0.0.1:6875**

### Default Credentials
- **Email**: `admin@admin.com`
- **Password**: `password`

## Notes
- The MariaDB database uses a Docker named volume (`bookstack_db_data`) to prevent file permission locking issues on Windows host filesystems.
- The `bookstack_data` folder is mounted to the host to allow easy access to the BookStack `.env` file and other configuration if needed.
