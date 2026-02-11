import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { paths } from './paths';
import { FirebaseUser } from './firebase';

interface BaseGuardContext {
  firebaseUser: FirebaseUser | null;
  userRole?: string | null;
  restaurantId?: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface GuardOptions {
  redirectTo?: string;
}

export function requireAuth(
  ctx: BaseGuardContext,
  router: AppRouterInstance,
  options: GuardOptions = {}
) {
  const { firebaseUser, isLoading, isInitialized } = ctx;
  if (isLoading || !isInitialized) return;

  if (!firebaseUser) {
    router.replace(options.redirectTo || paths.login);
  }
}

export function requireAdmin(
  ctx: BaseGuardContext,
  router: AppRouterInstance,
  options: GuardOptions = {}
) {
  const { firebaseUser, userRole, isLoading, isInitialized } = ctx;
  if (isLoading || !isInitialized) return;

  if (!firebaseUser || userRole !== 'admin') {
    router.replace(options.redirectTo || paths.admin.login);
  }
}

export function requireNoAuth(
  ctx: BaseGuardContext,
  router: AppRouterInstance,
  options: GuardOptions = {}
) {
  const { firebaseUser, isLoading, isInitialized } = ctx;
  if (isLoading || !isInitialized) return;

  if (firebaseUser) {
    router.replace(options.redirectTo || paths.dashboard.root);
  }
}

