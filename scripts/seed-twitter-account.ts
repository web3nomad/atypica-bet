import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

const getArg = (flag: string) => {
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : undefined;
};

const handle = getArg('--handle') || process.env.TWITTER_HANDLE;
const twitterUserId = getArg('--userId') || process.env.TWITTER_USER_ID;

if (!handle || !twitterUserId) {
  console.error(
    'Missing handle or userId. Use --handle and --userId or set TWITTER_HANDLE/TWITTER_USER_ID.'
  );
  process.exit(1);
}

async function seedAccount() {
  const account = await prisma.twitterAccount.upsert({
    where: { handle: handle! },
    update: {
      twitterUserId: twitterUserId!,
      isActive: true,
    },
    create: {
      handle: handle!,
      twitterUserId: twitterUserId!,
      isActive: true,
    },
  });

  console.log(`Seeded Twitter account: ${account.handle}`);
}

seedAccount()
  .catch((error) => {
    console.error('Failed to seed Twitter account:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
