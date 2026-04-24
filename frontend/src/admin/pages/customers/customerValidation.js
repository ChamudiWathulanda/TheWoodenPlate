const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]*$/;
const PHONE_REGEX = /^(?:\+94|0)\d{9}$/;

export const validateCustomerForm = (values) => {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const address = values.address.trim();

  if (!name) {
    errors.name = "Customer name is required.";
  } else if (name.length < 2) {
    errors.name = "Customer name must be at least 2 characters.";
  } else if (!NAME_REGEX.test(name)) {
    errors.name = "Customer name can only contain letters, spaces, apostrophes, dots, and hyphens.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = "Phone number must be like 07XXXXXXXX or +94XXXXXXXXX.";
  }

  if (address.length > 500) {
    errors.address = "Address cannot exceed 500 characters.";
  }

  return errors;
};

export const normalizeCustomerForm = (values) => ({
  name: values.name.trim(),
  email: values.email.trim().toLowerCase(),
  phone: values.phone.trim(),
  address: values.address.trim(),
});
