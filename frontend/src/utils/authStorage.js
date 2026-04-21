export const ADMIN_TOKEN_KEY = 'admin_token';
export const ADMIN_USER_KEY = 'admin_user';
export const CUSTOMER_TOKEN_KEY = 'customerToken';
export const CUSTOMER_USER_KEY = 'customer';

export const hasAdminSession = () => Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));

export const hasCustomerSession = () => Boolean(localStorage.getItem(CUSTOMER_TOKEN_KEY));

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
};

export const clearCustomerSession = () => {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_USER_KEY);
};
