import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../entities/user.entity';

describe('RolesGuard', () => {
  const createMockExecutionContext = (user?: { role: UserRole }) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => null,
      getClass: () => null,
    }) as any;

  describe('when there are no required roles', () => {
    it('should allow access when requiredRoles is undefined', () => {
      const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) };
      const guard = new RolesGuard(reflector as any);
      const context = createMockExecutionContext({ role: UserRole.USER });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when required roles array is empty', () => {
      const reflector = { getAllAndOverride: jest.fn().mockReturnValue([]) };
      const guard = new RolesGuard(reflector as any);
      const context = createMockExecutionContext({ role: UserRole.USER });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('when required roles are specified', () => {
    it('should allow access if user role matches', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
      };
      const guard = new RolesGuard(reflector as any);
      const context = createMockExecutionContext({ role: UserRole.ADMIN });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw when user has SUPER_ADMIN but ADMIN is required', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
      };
      const guard = new RolesGuard(reflector as any);
      const context = createMockExecutionContext({ role: UserRole.SUPER_ADMIN });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when no user on request', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
      };
      const guard = new RolesGuard(reflector as any);
      const context = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when role does not match', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
      };
      const guard = new RolesGuard(reflector as any);
      const context = createMockExecutionContext({ role: UserRole.USER });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
