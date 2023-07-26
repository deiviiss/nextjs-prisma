import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectionDB } from '@/libs/mongodb'
import User from '@/models/user'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'Enter email' },
        password: { label: 'Password', type: 'password', placeholder: 'Enter password' }
      },
      async authorize(credentials) {
        await connectionDB()

        const userFound = await User.findOne({ email: credentials?.email }).select('+password')

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!(userFound)) throw new Error('Invalid credentials')

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const passwordMatch = await bcrypt.compare(credentials!.password, userFound.password)
        if (!passwordMatch) throw new Error('Invalid credentials')

        return {
          id: userFound._id,
          fullname: userFound.fullname,
          email: userFound.email
        }
      }
    })
  ],
  callbacks: {
    jwt({ account, token, user, profile, session }) {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (user) token.user = user
      return token
    },
    session({ session, token }) {
      session.user = token.user as any
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
})

export { handler as GET, handler as POST }
