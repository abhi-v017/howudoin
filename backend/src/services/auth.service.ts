import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateTag } from '../utils/tagGenerator';
import { signToken } from '../utils/jwt';
import { AppError } from '../middlewares/error.middleware';
import { RegisterInput, LoginInput } from '../schema/auth.schema';

export class AuthService {
  /**
   * Register a new anonymous user with username + password.
   * Generates a short, clean Unique ID derived from the username (e.g. "abekrox_1971").
   * The username itself remains unchanged ("abekrox").
   */
  static async register(input: RegisterInput) {
    const rawUsername = input.username.trim();
    const { password, avatarUrl } = input;

    // Generate unique tag for this username
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
      throw new AppError('Unable to generate unique ID for this username. Please try again.', 409);
    }

    // Short Unique ID derived directly from the username
    const userId = `${rawUsername.toLowerCase()}_${tag}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default avatar if none provided
    const userAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${rawUsername}_${tag}`;

    const user = await prisma.user.create({
      data: {
        id: userId,
        username: rawUsername,
        tag,
        passwordHash,
        avatarUrl: userAvatar,
      },
      select: {
        id: true,
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
   * Login with username and password.
   * Accepts:
   * 1. Plain username: "abekrox"
   * 2. Short unique ID: "abekrox_1971"
   * 3. Username with tag: "abekrox#1971"
   */
  static async login(input: LoginInput) {
    let { username, tag, password } = input;
    username = username.trim();

    let user = null;

    // 1. If format is "Username#Tag"
    if (username.includes('#')) {
      const parts = username.split('#');
      const u = parts[0];
      const t = parts[1];
      user = await prisma.user.findUnique({
        where: { username_tag: { username: u, tag: t } },
      });
    }

    // 2. If entered exact Unique ID (e.g. "abekrox_1971")
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: username.toLowerCase() },
      });
    }

    // 3. If explicit tag passed
    if (!user && tag) {
      user = await prisma.user.findUnique({
        where: { username_tag: { username, tag } },
      });
    }

    // 4. If plain username entered, check matches
    if (!user) {
      const users = await prisma.user.findMany({
        where: { username: { equals: username, mode: 'insensitive' } },
      });

      if (users.length === 1) {
        user = users[0];
      } else if (users.length > 1) {
        throw new AppError('Multiple accounts found with this username. Please log in using your Unique ID (e.g. username_tag).', 400);
      }
    }

    if (!user) {
      throw new AppError('Invalid username or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid username or password', 401);
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      tag: user.tag,
    });

    return {
      user: {
        id: user.id,
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
