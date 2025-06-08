import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  memberId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  memberId?: string;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // For development - in production this would validate against Auth0
    if (email === 'admin@sukut.com' && password === 'admin123') {
      return {
        id: 'admin-1',
        email: 'admin@sukut.com',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
      };
    }

    // Check if user is a member
    const member = await this.prisma.member.findUnique({
      where: { email },
    });

    if (member) {
      return {
        id: `member-${member.id}`,
        email: member.email,
        role: 'member',
        memberId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      };
    }

    return null;
  }

  async login(user: AuthUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      memberId: user.memberId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        memberId: user.memberId,
      },
    };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<AuthUser> {
    if (payload.role === 'admin') {
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        firstName: 'System',
        lastName: 'Administrator',
      };
    }

    if (payload.role === 'member' && payload.memberId) {
      const member = await this.prisma.member.findUnique({
        where: { id: payload.memberId },
      });

      if (!member) {
        throw new UnauthorizedException('Member not found');
      }

      return {
        id: payload.sub,
        email: member.email,
        role: payload.role,
        memberId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      };
    }

    throw new UnauthorizedException('Invalid token payload');
  }

  async validateAuth0User(profile: any): Promise<AuthUser> {
    const email = profile.emails?.[0]?.value || profile.email;
    
    if (!email) {
      throw new UnauthorizedException('Email not provided by Auth0');
    }

    // Check if user is an admin (you can define admin emails in config)
    const adminEmails = ['admin@sukut.com', 'john.sukut@sukut.com'];
    if (adminEmails.includes(email)) {
      return {
        id: `auth0-${profile.id}`,
        email,
        role: 'admin',
        firstName: profile.name?.givenName || profile.given_name,
        lastName: profile.name?.familyName || profile.family_name,
      };
    }

    // Check if user is a member
    const member = await this.prisma.member.findUnique({
      where: { email },
    });

    if (member) {
      return {
        id: `auth0-${profile.id}`,
        email: member.email,
        role: 'member',
        memberId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      };
    }

    throw new UnauthorizedException('User not authorized to access this system');
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    if (userId.startsWith('admin-')) {
      return {
        id: userId,
        email: 'admin@sukut.com',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
      };
    }

    if (userId.startsWith('member-')) {
      const memberId = userId.replace('member-', '');
      const member = await this.prisma.member.findUnique({
        where: { id: memberId },
      });

      if (!member) {
        throw new NotFoundException('Member not found');
      }

      return {
        id: userId,
        email: member.email,
        role: 'member',
        memberId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      };
    }

    throw new NotFoundException('User not found');
  }
}