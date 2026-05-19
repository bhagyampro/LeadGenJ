import NextAuth, { type NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

async function ensureUserWorkspace(userId: string) {
  const existingWorkspace = await prisma.workspace.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  })

  if (!existingWorkspace) {
    await prisma.workspace.create({
      data: {
        name: 'My Workspace',
        ownerId: userId,
      },
    })
  }
}

async function ensureOAuthUser(input: {
  email: string
  name?: string | null
  image?: string | null
}) {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      fullName: input.name || input.email.split('@')[0],
      avatarUrl: input.image || undefined,
    },
    create: {
      email: input.email,
      fullName: input.name || input.email.split('@')[0],
      avatarUrl: input.image || null,
      creditsBalance: 50,
    },
  })

  await ensureUserWorkspace(user.id)

  const signupCredit = await prisma.creditTransaction.findFirst({
    where: {
      userId: user.id,
      featureUsed: 'google_signup_bonus',
    },
  })

  if (!signupCredit) {
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 50,
        transactionType: 'credit',
        featureUsed: 'google_signup_bonus',
      },
    })
  }

  return user
}

const providers: NextAuthConfig['providers'] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const user = await prisma.user.findUnique({
        where: { email: String(credentials.email) }
      })

      if (!user?.password) {
        return null
      }

      const isPasswordValid = await bcrypt.compare(String(credentials.password), user.password)

      if (!isPasswordValid) {
        return null
      }

      await ensureUserWorkspace(user.id)

      return {
        id: user.id,
        email: user.email,
        name: user.fullName,
        image: user.avatarUrl ?? undefined,
      }
    }
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  )
}

export const authConfig = {
  providers,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await ensureOAuthUser({
          email: user.email,
          name: user.name,
          image: user.image,
        })
        token.id = dbUser.id
        token.name = dbUser.fullName
        token.picture = dbUser.avatarUrl
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
