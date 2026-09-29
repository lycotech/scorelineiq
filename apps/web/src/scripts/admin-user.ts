// CLI for managing /admin logins. Not wired into any cron job — run
// by hand: npm run admin-user --workspace=web -- <command> [args]
//
//   create <email> <password>       add a new admin user
//   set-password <email> <password> reset an existing user's password
//   delete <email>                  remove an admin user
//   list                            list all admin users (no hashes)
import bcrypt from "bcryptjs";
import { prisma } from "@scorelineiq/db";

const MIN_PASSWORD_LENGTH = 12;

function usageAndExit(): never {
  console.error(
    "Usage:\n" +
      "  npm run admin-user --workspace=web -- create <email> <password>\n" +
      "  npm run admin-user --workspace=web -- set-password <email> <password>\n" +
      "  npm run admin-user --workspace=web -- delete <email>\n" +
      "  npm run admin-user --workspace=web -- list",
  );
  process.exit(1);
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function assertUsablePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }
}

async function create(email: string, password: string) {
  assertUsablePassword(password);
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.error(`${email} already has an admin account. Use "set-password" to change it.`);
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.create({ data: { email, passwordHash } });
  console.log(`Created admin user: ${email}`);
}

async function setPassword(email: string, password: string) {
  assertUsablePassword(password);
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (!existing) {
    console.error(`No admin user with email ${email}. Use "create" instead.`);
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.update({ where: { email }, data: { passwordHash } });
  console.log(`Updated password for: ${email}`);
}

async function remove(email: string) {
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (!existing) {
    console.error(`No admin user with email ${email}.`);
    process.exit(1);
  }
  await prisma.adminUser.delete({ where: { email } });
  console.log(`Deleted admin user: ${email}`);
}

async function list() {
  const users = await prisma.adminUser.findMany({
    select: { email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  if (users.length === 0) {
    console.log("No admin users yet.");
    return;
  }
  for (const user of users) {
    console.log(`${user.email}\t(created ${user.createdAt.toISOString()})`);
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "create": {
      const [email, password] = args;
      if (!email || !password) usageAndExit();
      await create(normalizeEmail(email), password);
      break;
    }
    case "set-password": {
      const [email, password] = args;
      if (!email || !password) usageAndExit();
      await setPassword(normalizeEmail(email), password);
      break;
    }
    case "delete": {
      const [email] = args;
      if (!email) usageAndExit();
      await remove(normalizeEmail(email));
      break;
    }
    case "list":
      await list();
      break;
    default:
      usageAndExit();
  }
}

main()
  .catch((error) => {
    console.error("admin-user failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
