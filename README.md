### barbershop API

After cloning the repository, install dependencies:

```bash
npm install
```

Running Prisma commands like `prisma migrate reset` requires using the local CLI version. Make sure dependencies are installed so `npx prisma` uses the version defined in `package.json` (`5.14.0`). Without this step you may encounter errors such as:

```
Failed to deserialize constructor options: missing field `enableTracing`
```

Once dependencies are installed and your database is running, reset and seed the database with:

```bash
npx prisma migrate reset
```

