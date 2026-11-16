import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { generateTag } from '../utils/tagGenerator';
import { signToken } from '../utils/jwt';
import { AppError } from '../middlewares/error.middleware';
import { RegisterInput, LoginInput } from '../schema/auth.schema';

export class AuthService {
  /**
   * Register a user with Email, Username, and Password.
   * Enforces email uniqueness and generates a short unique ID (e.g. "alice_1971").
   */
  static async register(input: RegisterInput) {
    const email = input.email.toLowerCase().trim();
    const rawUsername = input.username.trim();
    const { password, avatarUrl } = input;

    // 1. Check if an account already exists with this email
    const existingEmail = await prisma.user.findFirst({
      where: { email },
    });

    if (existingEmail) {
      throw new AppError('An account with this email address already exists. Please log in instead.', 409);
    }

    // 2. Generate a unique tag for this username
    let tag = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      tag = generateTag();
      const existing = await prisma.user.findUnique({
        where: {
          username_tag: { username: rawUsername, tag },
        },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new AppError('Unable to generate unique ID for this username. Please try a slightly different username.', 409);
    }

    // 3. Short Unique ID derived directly from the username
    const userId = `${rawUsername.toLowerCase()}_${tag}`;

    // 4. Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Default avatar
    const userAvatar =
      avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${rawUsername}_${tag}`;

    // 6. Save user to database
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        username: rawUsername,
        tag,
        passwordHash,
        avatarUrl: userAvatar,
      },
      select: {
        id: true,
        email: true,
        username: true,
        tag: true,
        avatarUrl: true,
        bio: true,
        theme: true,
        createdAt: true,
      },
    });

    const token = signToken({
      userId: user.id,
      username: user.username,
      tag: user.tag,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tag: user.tag,
        displayName: user.username,
        uniqueId: user.id,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        theme: user.theme,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Log in using Email OR Username, plus Password.
   * Accepts:
   * 1. Email address: "alice@example.com"
   * 2. Username: "alice"
   * 3. Short Unique ID: "alice_1971"
   * 4. Username#Tag: "alice#1971"
   */
  static async login(input: LoginInput) {
    const rawIdentifier = input.identifier.trim();
    const { password } = input;

    let user: any = null;

    // A. Check if identifier is an Email
    if (rawIdentifier.includes('@')) {
      user = await prisma.user.findFirst({
        where: { email: rawIdentifier.toLowerCase() },
      });
    }

    // B. Check if identifier is "Username#Tag"
    if (!user && rawIdentifier.includes('#')) {
      const [u, t] = rawIdentifier.split('#');
      user = await prisma.user.findUnique({
        where: { username_tag: { username: u, tag: t } },
      });
    }

    // C. Check if identifier is exact Unique ID (e.g. "alice_1971")
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: rawIdentifier.toLowerCase() },
      });
    }

    // D. Check plain username
    if (!user) {
      const matches = await prisma.user.findMany({
        where: { username: { equals: rawIdentifier, mode: 'insensitive' } },
      });

      if (matches.length === 1) {
        user = matches[0];
      } else if (matches.length > 1) {
        throw new AppError(
          'Multiple accounts share this username. Please log in using your Email or Unique ID.',
          400
        );
      }
    }

    if (!user) {
      throw new AppError('Invalid email/username or password', 401);
    }

    if (!user.passwordHash) {
      throw new AppError(
        'This account was created with Google Sign-In. Please click "Continue with Google" to log in.',
        400
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email/username or password', 401);
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      tag: user.tag,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tag: user.tag,
        displayName: user.username,
        uniqueId: user.id,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        theme: user.theme,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Google OAuth 2.0 Sign-In & Sign-Up
   * Verifies the Google ID token and creates or logs in the user automatically.
   */
  static async googleLogin(credential: string) {
    if (!credential) {
      throw new AppError('Google credential token is required', 400);
    }

    // Verify token with Google's public tokeninfo endpoint
    let googlePayload: any = null;
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (!response.ok) {
        throw new Error('Google token verification failed');
      }
      googlePayload = await response.json();
    } catch {
      throw new AppError('Google authentication failed. Please verify your token or use email login.', 401);
    }

    const { sub: googleId, email, name, email_verified, aud } = googlePayload;

    if (config.googleClientId && aud !== config.googleClientId) {
      throw new AppError('Google token was not issued for this application', 401);
    }

    if (!email || email_verified === 'false' || email_verified === false) {
      throw new AppError('A verified Google email address is required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Look for existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email: normalizedEmail }],
      },
    });

    if (user) {
      const updates: { googleId?: string; avatarUrl?: string } = {};
      if (!user.googleId) {
        updates.googleId = googleId;
      }
      // If user had no avatar or previously had Google picture stored, replace with privacy-first avatar
      if (!user.avatarUrl || user.avatarUrl.includes('googleusercontent.com') || user.avatarUrl.includes('ggpht.com')) {
        updates.avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.id)}`;
      }
      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    } else {
      // 2. Create new user from Google profile without personal Google photo
      let baseUsername = (name || email.split('@')[0])
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .slice(0, 20);
      if (baseUsername.length < 3) baseUsername = 'user_' + Math.floor(Math.random() * 1000);

      const tag = generateTag();
      const userId = `${baseUsername.toLowerCase()}_${tag}`;

      user = await prisma.user.create({
        data: {
          id: userId,
          email: normalizedEmail,
          googleId,
          username: baseUsername,
          tag,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userId)}`,
        },
      });
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      tag: user.tag,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tag: user.tag,
        displayName: user.username,
        uniqueId: user.id,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        theme: user.theme,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Fetch current authenticated user's profile
   */
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        tag: true,
        avatarUrl: true,
        bio: true,
        theme: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      ...user,
      displayName: user.username,
      uniqueId: user.id,
    };
  }
}
