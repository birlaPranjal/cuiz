import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User, { IUser } from '@/models/User';
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          throw new Error('Please enter email and password');
        }

        try {
          console.log(`Attempting to authenticate: ${credentials.email}`);
          await connectToDatabase();
          
          const user = await User.findOne({ email: credentials.email }).select('+password');
          
          if (!user) {
            console.log(`No user found: ${credentials.email}`);
            throw new Error('No user found with this email');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log(`Invalid password for: ${credentials.email}`);
            throw new Error('Invalid password');
          }

          const typedUser = user as IUser;
          
          console.log(`Authentication successful for: ${credentials.email}, role: ${typedUser.role}`);
          return {
            id: typedUser._id.toString(),
            name: typedUser.name,
            email: typedUser.email,
            role: typedUser.role,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error(error instanceof Error ? error.message : 'Database connection failed');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        console.log("JWT Callback - User info added to token:", { id: user.id, role: user.role });
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        console.log("Session Callback - Token info added to session:", { id: token.id, role: token.role });
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log(`Redirect callback - URL: ${url}, Base URL: ${baseUrl}`);
      
      // Always direct to dashboard after sign in, the dashboard component will handle
      // routing to the appropriate role-specific dashboard
      if (url.startsWith(baseUrl)) {
        const dashboardUrl = `${baseUrl}/dashboard`;
        console.log(`Redirecting to: ${dashboardUrl}`);
        return dashboardUrl;
      }
      return baseUrl;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'yoursecretkey',
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 