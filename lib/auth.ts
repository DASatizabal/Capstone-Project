import { AuthOptions, Session, User as NextAuthUser, DefaultSession } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { clientPromise } from './mongodb';
import CredentialsProvider from 'next-auth/providers/credentials';
import { User, IUser } from '@/models';
import dbConnect from './dbConnect';
import { Adapter } from 'next-auth/adapters';
import { JWT } from 'next-auth/jwt';



// Extend the built-in types for our application
declare module 'next-auth' {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  }
  
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  session: {
    strategy: 'jwt', // Use JWT for session management
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        await dbConnect();
        const user = await User.findOne({ email: credentials.email })
          .select('+hashedPassword')
          .lean()
          .exec();

        if (!user || !('hashedPassword' in user)) {
          throw new Error('Invalid email or password');
        }

        // Type assertion to access the comparePassword method
        const userWithMethods = user as IUser & { comparePassword: (password: string) => Promise<boolean> };
        
        // Import bcrypt dynamically to avoid issues with edge runtime
        const bcrypt = await import('bcryptjs');
        const isPasswordValid = await bcrypt.compare(credentials.password, user.hashedPassword || '');

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Return only the necessary user data
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};


