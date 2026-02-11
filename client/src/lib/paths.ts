export const paths = {
  home: '/' as const,
  login: '/login' as const,
  signup: '/signup' as const,

  dashboard: {
    root: '/dashboard' as const,
    menu: '/dashboard/menu' as const,
    qr: '/dashboard/qr' as const,
    settings: '/dashboard/settings' as const,
    setup: '/dashboard/setup' as const,
    subscription: '/dashboard/subscription' as const,
    feedback: '/dashboard/feedback' as const,
    customerFeedback: '/dashboard/customer-feedback' as const,
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

