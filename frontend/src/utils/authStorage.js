export const ADMIN_TOKEN_KEY = 'admin_token';
export const ADMIN_USER_KEY = 'admin_user';
export const CUSTOMER_TOKEN_KEY = 'customerToken';
export const CUSTOMER_USER_KEY = 'customer';
export const ADMIN_NOTIFICATION_IDENTITY_KEY = 'admin_notification_identity';

const normalizeAdminIdentity = (adminUser = {}) => {
  if (adminUser?.email) {
    return String(adminUser.email).trim().toLowerCase();
  }

  if (adminUser?.id) {
    return `admin-${adminUser.id}`;
  }

  return '';
};

export const hasAdminSession = () => Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));

export const hasCustomerSession = () => Boolean(localStorage.getItem(CUSTOMER_TOKEN_KEY));

export const getStoredAdminNotificationIdentity = () =>
  localStorage.getItem(ADMIN_NOTIFICATION_IDENTITY_KEY) || 'default';

export const persistAdminNotificationIdentity = (adminUser = {}) => {
  const identity = normalizeAdminIdentity(adminUser);

  if (identity) {
    localStorage.setItem(ADMIN_NOTIFICATION_IDENTITY_KEY, identity);
    return identity;
  }

  return getStoredAdminNotificationIdentity();
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
};

export const clearCustomerSession = () => {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_USER_KEY);
};
