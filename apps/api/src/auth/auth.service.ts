import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { passwordResetEmail, welcomeEmail, welcomeSetPasswordEmail } from '../email/email-templates';
import { FacebookCapiService } from '../facebook/facebook-capi.service';
import {
  RegisterDto,
  LoginDto,
  GoogleAuthDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LogoutDto,
  UpdateProfileDto,
} from './dto';
import { AuthResponse, AuthTokens, UserProfile } from '@bestsellers/shared';

const BCRYPT_ROUNDS = 12;
const MAX_SESSIONS = 5;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour in ms

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfigService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly facebookCapiService: FacebookCapiService,
  ) {
    this.googleClient = new OAuth2Client(this.appConfig.googleClientId);
  }

  // ─── Register ────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      locale: dto.locale,
      phoneNumber: dto.phoneNumber,
      source: dto.source,
      visitorId: dto.visitorId,
      referrer: dto.referrer,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      utmContent: dto.utmContent,
      utmTerm: dto.utmTerm,
      timezone: dto.timezone,
      deviceType: dto.deviceType,
      browserLanguage: dto.browserLanguage,
      geoCountry: dto.geoCountry,
      geoCity: dto.geoCity,
    });

    const tokens = await this.generateTokens(user.id);
    await this.saveSession(user.id, tokens.refreshToken);

    const profile = await this.usersService.buildUserProfile(user);

    // Fire Lead event via CAPI (deduplicates with browser-side via leadEventId)
    if (dto.leadEventId) {
      this.facebookCapiService.sendEvent({
        event_name: 'Lead',
        event_id: dto.leadEventId,
        event_source_url: `${this.appConfig.frontendUrl}/${dto.source === 'chat' ? 'chat' : 'auth/register'}`,
        user_data: {
          em: user.email,
          fn: user.name?.split(' ')[0],
          ln: user.name?.includes(' ') ? user.name.split(' ').slice(1).join(' ') : undefined,
          ph: user.phoneNumber ?? undefined,
          external_id: user.id,
          fbp: dto.fbp,
          fbc: dto.fbc,
        },
        custom_data: {
          content_name: dto.source ?? 'register',
          content_category: 'registration',
        },
      });
    }

    if (dto.source === 'chat' || dto.source === 'guest') {
      // Auto-generated password: send welcome + set password email
      this.sendWelcomeSetPasswordEmail(user.email, user.name, user.locale);
    } else {
      const email = welcomeEmail({
        userName: user.name ?? 'there',
        loginUrl: `${this.appConfig.frontendUrl}/dashboard`,
        locale: user.locale,
      });
      this.emailService.send({
        to: user.email,
        subject: email.subject,
        html: email.html,
      });
    }

    return { user: profile, tokens };
  }

  // ─── Login ───────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthResponse> {
    // findByEmail returns user WITH passwordHash
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // OAuth-only accounts have no password
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id);
    await this.saveSession(user.id, tokens.refreshToken);

    const profile = await this.usersService.buildUserProfile(user);

    return { user: profile, tokens };
  }

  // ─── Google Auth ─────────────────────────────────────────────────────

  async googleAuth(dto: GoogleAuthDto): Promise<AuthResponse> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: this.appConfig.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const { email, name, picture, sub: googleId } = payload;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);

    let user;

    if (!existingUser) {
      // Scenario 1: New user - create with Google account
      user = await this.usersService.create({
        email,
        name: name ?? undefined,
        avatarUrl: picture ?? undefined,
        emailVerified: new Date(),
        provider: 'google',
        providerAccountId: googleId,
        source: 'google',
        visitorId: dto.visitorId,
        referrer: dto.referrer,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        utmContent: dto.utmContent,
        utmTerm: dto.utmTerm,
        timezone: dto.timezone,
        deviceType: dto.deviceType,
        browserLanguage: dto.browserLanguage,
        geoCountry: dto.geoCountry,
        geoCity: dto.geoCity,
      });

      // Fire Lead event via CAPI for new Google users
      if (dto.leadEventId) {
        this.facebookCapiService.sendEvent({
          event_name: 'Lead',
          event_id: dto.leadEventId,
          event_source_url: `${this.appConfig.frontendUrl}/auth/login`,
          user_data: {
            em: email,
            fn: name?.split(' ')[0],
            ln: name?.includes(' ') ? name.split(' ').slice(1).join(' ') : undefined,
            external_id: user.id,
            fbp: dto.fbp,
            fbc: dto.fbc,
          },
          custom_data: {
            content_name: 'google',
            content_category: 'registration',
          },
        });
      }
    } else {
      // Check if Google account is already linked
      const existingAccount = await this.prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: googleId,
          },
        },
      });

      if (!existingAccount) {
        // Scenario 2: Existing user without Google account - link it
        await this.prisma.account.create({
          data: {
            userId: existingUser.id,
            provider: 'google',
            providerAccountId: googleId,
          },
        });

        // Update profile with Google info if missing
        if (!existingUser.avatarUrl && picture) {
          await this.usersService.updateProfile(existingUser.id, {
            avatarUrl: picture,
          });
        }

        // Mark email as verified if not already
        if (!existingUser.emailVerified) {
          await this.prisma.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: new Date() },
          });
        }
      }
      // Scenario 3: Existing user with Google account already linked - just login

      user = existingUser;
    }

    const tokens = await this.generateTokens(user.id);
    await this.saveSession(user.id, tokens.refreshToken);

    const profile = await this.usersService.buildUserProfile(user);

    return { user: profile, tokens };
  }

  // ─── Refresh Tokens ──────────────────────────────────────────────────

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthResponse> {
    // Decode refresh token to get userId
    let decoded: { sub: string };
    try {
      decoded = this.jwtService.verify(dto.refreshToken, {
        secret: this.appConfig.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find all sessions for this user and check which one matches
    const sessions = await this.prisma.session.findMany({
      where: { userId: decoded.sub },
    });

    let matchedSession: (typeof sessions)[number] | null = null;
    for (const session of sessions) {
      const isMatch = await bcrypt.compare(dto.refreshToken, session.sessionToken);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check expiry
    if (matchedSession.expires < new Date()) {
      await this.prisma.session.delete({ where: { id: matchedSession.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(decoded.sub);
    const sessionTokenHash = await bcrypt.hash(tokens.refreshToken, BCRYPT_ROUNDS);

    // Atomic rotation: delete old session + create new one in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete the old session
      await tx.session.delete({ where: { id: matchedSession.id } }).catch(() => {
        // Session already deleted by a concurrent request — this is a race condition
        throw new UnauthorizedException('Refresh token already used');
      });

      // Enforce max sessions
      const sessionCount = await tx.session.count({
        where: { userId: decoded.sub },
      });

      if (sessionCount >= MAX_SESSIONS) {
        const oldest = await tx.session.findMany({
          where: { userId: decoded.sub },
          orderBy: { expires: 'asc' },
          take: sessionCount - MAX_SESSIONS + 1,
        });
        if (oldest.length > 0) {
          await tx.session.deleteMany({
            where: { id: { in: oldest.map((s) => s.id) } },
          });
        }
      }

      await tx.session.create({
        data: {
          userId: decoded.sub,
          sessionToken: sessionTokenHash,
          expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        },
      });
    });

    const user = await this.usersService.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const profile = await this.usersService.buildUserProfile(user);

    return { user: profile, tokens };
  }

  // ─── Forgot Password ────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);

    // Always return 200 to avoid leaking whether email exists
    if (!user) {
      return;
    }

    const resetUrl = await this.generatePasswordResetUrl(user.email);

    const email = passwordResetEmail({
      resetUrl,
      userName: user.name ?? undefined,
      locale: user.locale,
    });
    this.emailService.send({
      to: user.email,
      subject: email.subject,
      html: email.html,
    });
  }

  // ─── Welcome + Set Password Email ──────────────────────────────────

  /**
   * Generates a password reset token and sends a welcome + set-password email.
   * Used for auto-created accounts (chat funnel, guest checkout).
   */
  async sendWelcomeSetPasswordEmail(
    userEmail: string,
    userName?: string | null,
    locale?: string | null,
  ): Promise<void> {
    try {
      const resetUrl = await this.generatePasswordResetUrl(userEmail);

      const email = welcomeSetPasswordEmail({
        userName: userName ?? 'there',
        resetUrl,
        locale: locale ?? undefined,
      });
      this.emailService.send({
        to: userEmail,
        subject: email.subject,
        html: email.html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send welcome set-password email to ${userEmail}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  // ─── Reset Password ─────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    // Hash the incoming token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const verificationToken = await this.prisma.verificationToken.findFirst({
      where: {
        token: tokenHash,
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.usersService.findByEmail(verificationToken.identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash and update the new password
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersService.updatePassword(user.id, passwordHash);

    // Invalidate all sessions for the user
    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Delete the used verification token
    await this.prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    this.logger.log(`Password reset completed for user: ${user.id}`);
  }

  // ─── Logout ──────────────────────────────────────────────────────────

  async logout(dto: LogoutDto): Promise<void> {
    // Decode refresh token to find user's sessions
    let decoded: { sub: string };
    try {
      decoded = this.jwtService.verify(dto.refreshToken, {
        secret: this.appConfig.jwtRefreshSecret,
      });
    } catch {
      // Token is invalid/expired - nothing to do (idempotent)
      return;
    }

    // Find and delete the matching session
    const sessions = await this.prisma.session.findMany({
      where: { userId: decoded.sub },
    });

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(dto.refreshToken, session.sessionToken);
      if (isMatch) {
        await this.prisma.session.delete({ where: { id: session.id } });
        break;
      }
    }
  }

  // ─── Get Profile ────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.usersService.buildUserProfile(user);
  }

  // ─── Update Profile ──────────────────────────────────────────────────

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const updatedUser = await this.usersService.updateProfile(userId, {
      name: dto.name,
      avatarUrl: dto.avatarUrl,
      locale: dto.locale,
      phoneNumber: dto.phoneNumber,
    });

    return this.usersService.buildUserProfile(updatedUser);
  }

  // ─── Clean Expired Sessions ──────────────────────────────────────────

  async cleanExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned ${result.count} expired sessions`);
    }

    return result.count;
  }

  // ─── Private Methods ────────────────────────────────────────────────

  /**
   * Creates a verification token for password reset and returns the full reset URL.
   * Reused by forgotPassword and sendWelcomeSetPasswordEmail.
   */
  private async generatePasswordResetUrl(email: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Delete any existing verification tokens for this user
    await this.prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Create verification token with hashed value
    await this.prisma.verificationToken.create({
      data: {
        identifier: email,
        token: tokenHash,
        expires: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
      },
    });

    if (!this.appConfig.isProduction) {
      this.logger.debug(`Password reset token for ${email}: ${rawToken}`);
    }

    return `${this.appConfig.frontendUrl}/auth/reset-password?token=${rawToken}`;
  }

  private async generateTokens(userId: string): Promise<AuthTokens> {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.appConfig.jwtSecret,
        expiresIn: ACCESS_TOKEN_EXPIRY,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.appConfig.jwtRefreshSecret,
        expiresIn: REFRESH_TOKEN_EXPIRY,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveSession(userId: string, refreshToken: string): Promise<void> {
    const sessionTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);

    // Check existing session count
    const sessionCount = await this.prisma.session.count({
      where: { userId },
    });

    // If at max sessions, delete the oldest one(s)
    if (sessionCount >= MAX_SESSIONS) {
      const oldestSessions = await this.prisma.session.findMany({
        where: { userId },
        orderBy: { expires: 'asc' },
        take: sessionCount - MAX_SESSIONS + 1,
      });

      if (oldestSessions.length > 0) {
        await this.prisma.session.deleteMany({
          where: {
            id: { in: oldestSessions.map((s) => s.id) },
          },
        });
      }
    }

    // Create new session
    await this.prisma.session.create({
      data: {
        userId,
        sessionToken: sessionTokenHash,
        expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });
  }
}
