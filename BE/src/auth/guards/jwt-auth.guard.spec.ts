import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const createMockExecutionContext = () =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: null }),
        getResponse: () => ({}),
      }),
      getHandler: () => null,
      getClass: () => null,
    }) as any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when route is decorated with @Public()', () => {
    it('should return true and skip authentication', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = createMockExecutionContext();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('when route is not public', () => {
    it('should delegate to super.canActivate for authentication', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should delegate to super.canActivate when isPublic is undefined', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow();
    });
  });
});
