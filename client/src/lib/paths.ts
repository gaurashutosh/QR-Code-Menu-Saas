export const paths = {
  home: '/' as const,
  login: '/login' as const,
  signup: '/signup' as const,
  forgotPassword: '/forgot-password' as const,
  terms: '/terms' as const,
  privacy: '/privacy' as const,

  dashboard: {
    root: '/dashboard' as const,
    menu: '/dashboard?tab=menu' as const,
    qr: '/dashboard?tab=qr' as const,
    settings: '/dashboard?tab=settings' as const,
    setup: '/dashboard?tab=setup' as const,
    subscription: '/dashboard?tab=subscription' as const,
    feedback: '/dashboard?tab=feedback' as const,
    customerFeedback: '/dashboard?tab=customer-feedback' as const,
  },

  admin: {
    login: '/admin/login' as const,
    root: '/admin' as const,
    users: '/admin/users' as const,
    restaurants: '/admin/restaurants' as const,
    analytics: '/admin/analytics' as const,
    feedback: '/admin/feedback' as const,
  },

  menuForSlug: (slug: string) => `/menu/${slug}` as const,
} as const;

export type AppPath =
  | typeof paths.home
  | typeof paths.login
  | typeof paths.signup
  | (typeof paths.dashboard)[keyof typeof paths.dashboard]
  | (typeof paths.admin)[keyof typeof paths.admin];

