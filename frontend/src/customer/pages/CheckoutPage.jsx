import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomerLayout from '../layout/customerLayout';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import CustomerAuthModal from '../components/CustomerAuthModal';
import toast from 'react-hot-toast';

const PHONE_REGEX = /^(?:\+94|0)\d{9}$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]{1,99}$/;

const fieldClassName = "w-full rounded-2xl border border-[#8B5A2B]/28 bg-[#0F0A08]/72 px-4 py-3 text-[#F5E5CC] outline-none transition placeholder:text-[#E7D2B6]/35 focus:border-[#D7B38A]/55";
const ONLINE_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { customer, token, loading: authLoading, isAuthenticated } = useCustomerAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated()) {
      setShowAuthModal(true);
    }
  }, [authLoading, isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    order_type: 'dine-in',
    delivery_address: '',
    special_instructions: '',
    payment_method: 'cash',
    card_type: '',
    card_name: '',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
  });
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const [cardInfo, setCardInfo] = useState({
    isValid: false,
    isValidating: false
  });

  const [loading, setLoading] = useState(false);
  const [pricingPreview, setPricingPreview] = useState({
    subtotal: total,
    discount: 0,
    total,
    applied_promotions: [],
    line_items: [],
  });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState('');

  useEffect(() => {
    if (!customer) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      customer_name: prev.customer_name || customer.name || '',
      customer_phone: prev.customer_phone || customer.phone || '',
      customer_email: prev.customer_email || customer.email || '',
      delivery_address: prev.delivery_address || customer.address || '',
    }));
  }, [customer]);

  useEffect(() => {
    let cancelled = false;

    const loadPricingPreview = async () => {
      if (items.length === 0) {
        setPricingPreview({
          subtotal: 0,
          discount: 0,
          total: 0,
          applied_promotions: [],
          line_items: [],
        });
        setPricingError('');
        return;
      }

      setPricingLoading(true);
      try {
        const response = await axios.post(
          '/api/public/order-preview',
          {
            items: items.map((item) => ({
              menu_item_id: item.id,
              quantity: item.quantity,
            })),
          },
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!cancelled) {
          setPricingPreview(
            response.data?.data || {
              subtotal: total,
              discount: 0,
              total,
              applied_promotions: [],
              line_items: [],
            }
          );
          setPricingError('');
        }
      } catch (error) {
        if (!cancelled) {
          setPricingPreview({
            subtotal: total,
            discount: 0,
            total,
            applied_promotions: [],
            line_items: [],
          });
          setPricingError(error.response?.data?.message || 'Unable to load active promotions right now.');
        }
      } finally {
        if (!cancelled) {
          setPricingLoading(false);
        }
      }
    };

    loadPricingPreview();

    return () => {
      cancelled = true;
    };
  }, [items, total]);

  const previewLineItems = useMemo(
    () => new Map((pricingPreview.line_items || []).map((line) => [line.menu_item_id, line])),
    [pricingPreview.line_items]
  );

  const sanitizePhone = (value) => value.replace(/[^\d+]/g, '');

  const validateCardNumber = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = cleanNumber.length - 1; i >= 0; i -= 1) {
      let digit = parseInt(cleanNumber.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  };

  const validateExpiryDate = (month, year) => {
    if (!month || !year) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const expiryYear = parseInt(year, 10);
    const expiryMonth = parseInt(month, 10);

    if (expiryYear < currentYear) return false;
    if (expiryYear === currentYear && expiryMonth < currentMonth) return false;

    return true;
  };

  const updateCardValidation = (cardNumber, expiryMonth, expiryYear) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const isValidNumber = validateCardNumber(cleanNumber);
    const isValidExpiry = validateExpiryDate(expiryMonth, expiryYear);

    setCardInfo({
      isValid: isValidNumber && isValidExpiry && cleanNumber.length >= 13,
      isValidating: cleanNumber.length > 0
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'payment_method') {
      setFormData((prev) => ({
        ...prev,
        payment_method: value,
        ...(value !== 'card'
          ? {
              card_type: '',
              card_name: '',
              card_number: '',
              expiry_month: '',
              expiry_year: '',
              cvv: '',
            }
          : {}),
      }));

      if (value !== 'online') {
        setPaymentReceipt(null);
      }

      if (value !== 'card') {
        setCardInfo({ isValid: false, isValidating: false });
      }
      return;
    }

    if (name === 'card_number') {
      const formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      updateCardValidation(formattedValue, formData.expiry_month, formData.expiry_year);
      return;
    }

    if (name === 'expiry_month' || name === 'expiry_year') {
      setFormData((prev) => ({ ...prev, [name]: value }));
      updateCardValidation(
        formData.card_number,
        name === 'expiry_month' ? value : formData.expiry_month,
        name === 'expiry_year' ? value : formData.expiry_year
      );
      return;
    }

    if (name === 'customer_phone') {
      setFormData((prev) => ({ ...prev, [name]: sanitizePhone(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setPaymentReceipt(null);
      return;
    }

    if (!ONLINE_RECEIPT_TYPES.includes(file.type)) {
      toast.error('Upload a JPG, PNG, or PDF receipt');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Receipt must be 5MB or smaller');
      e.target.value = '';
      return;
    }

    setPaymentReceipt(file);
  };

  const validateForm = () => {
    const trimmedName = formData.customer_name.trim();
    const trimmedPhone = formData.customer_phone.trim();
    const trimmedAddress = formData.delivery_address.trim();

    if (!NAME_REGEX.test(trimmedName)) {
      toast.error('Please enter a valid full name');
      return false;
    }

    if (!PHONE_REGEX.test(trimmedPhone)) {
      toast.error('Please enter a valid phone number (e.g. 0771234567 or +94771234567)');
      return false;
    }

    if (formData.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (formData.order_type === 'delivery' && trimmedAddress.length < 10) {
      toast.error('Please enter a complete delivery address');
      return false;
    }

    if (formData.special_instructions.length > 500) {
      toast.error('Special instructions must be 500 characters or fewer');
      return false;
    }

    if (formData.payment_method === 'card' && !/^\d{3,4}$/.test(formData.cvv.trim())) {
      toast.error('Please enter a valid CVV');
      return false;
    }

    if (formData.payment_method === 'online' && !paymentReceipt) {
      toast.error('Please upload your payment receipt');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (formData.payment_method === 'card') {
      if (!formData.card_type) {
        toast.error('Please select card type');
        return;
      }
      if (!cardInfo.isValid) {
        toast.error('Please enter valid card details');
        return;
      }
      if (!formData.card_name.trim()) {
        toast.error('Please enter cardholder name');
        return;
      }
      if (!formData.cvv.trim()) {
        toast.error('Please enter CVV');
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        orderData.append(key, value ?? '');
      });
      orderData.append(
        'items',
        JSON.stringify(
          items.map((item) => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price,
          }))
        )
      );

      if (paymentReceipt) {
        orderData.append('payment_receipt', paymentReceipt);
      }

      await axios.post('/api/customer/orders', orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/my-orders');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const previewTotalItems = (pricingPreview.line_items || []).length
    ? pricingPreview.line_items.reduce((sum, line) => sum + Number(line.total_quantity ?? line.quantity ?? 0), 0)
    : totalItems;
  const subtotalAmount = Number(pricingPreview.subtotal ?? total);
  const discountAmount = Number(pricingPreview.discount ?? 0);
  const payableTotal = Number(pricingPreview.total ?? total);

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="w-full px-4 pt-32 pb-16 text-center sm:px-6">
          <h1 className="text-3xl font-semibold">Checkout</h1>
          <p className="mt-2 text-[#E7D2B6]/70">Your cart is empty</p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-4 rounded-lg bg-[#C98A5A] px-6 py-2 text-[#0F0A08]"
          >
            Browse Menu
          </button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#3a2418_0%,#1a110d_34%,#0f0a08_74%)] px-4 pt-32 pb-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 rounded-[2rem] border border-[#8B5A2B]/35 bg-[#1A110D]/80 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-3 inline-flex rounded-full border border-[#D7B38A]/25 bg-[#D7B38A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#D7B38A]">
                  Final step
                </p>
                <h1 className="text-4xl font-bold text-[#F6E7D0] sm:text-5xl">
                  Checkout with a smoother service flow.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-[#E7D2B6]/72 sm:text-lg">
                  Confirm guest details, pick your order style, and complete payment in one premium checkout experience.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-[#8B5A2B]/25 bg-[#0F0A08]/62 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#E7D2B6]/45">Items</p>
                  <p className="mt-2 text-3xl font-bold text-[#F6E7D0]">{previewTotalItems}</p>
                </div>
                <div className="rounded-2xl border border-[#8B5A2B]/25 bg-[#0F0A08]/62 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#E7D2B6]/45">Total</p>
                  <p className="mt-2 text-2xl font-bold text-[#C98A5A]">Rs. {payableTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.45fr)]">
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-[#8B5A2B]/28 bg-[linear-gradient(160deg,rgba(26,17,13,0.95),rgba(37,24,18,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#E7D2B6]/45">Order summary</p>
                    <h2 className="mt-2 text-2xl font-bold text-[#F6E7D0]">Before we place it</h2>
                  </div>
                  <div className="rounded-full border border-[#D7B38A]/20 bg-[#D7B38A]/10 px-4 py-2 text-sm font-semibold text-[#F6E7D0]">
                    {previewTotalItems} items
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => {
                    const linePreview = previewLineItems.get(item.id);
                    const bonusQuantity = Number(linePreview?.bonus_quantity ?? 0);
                    const totalQuantity = Number(linePreview?.total_quantity ?? item.quantity);
                    const baseLineTotal = Number(linePreview?.line_subtotal ?? (item.price * item.quantity));
                    const discountedLineTotal = Number(linePreview?.discounted_subtotal ?? baseLineTotal);
                    const lineDiscount = Number(linePreview?.discount ?? 0);

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[#8B5A2B]/16 bg-[#0F0A08]/48 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-base font-semibold text-[#F6E7D0]">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-xs text-[#E7D2B6]/60">
                              {item.quantity} paid x Rs. {item.price.toLocaleString()}
                            </p>
                            {bonusQuantity > 0 && (
                              <p className="mt-2 text-xs font-semibold text-emerald-300">
                                + {bonusQuantity} free item{bonusQuantity > 1 ? 's' : ''} added, total {totalQuantity}
                              </p>
                            )}
                            {linePreview?.applied_promotion && (
                              <p className="mt-2 text-xs font-semibold text-emerald-300">
                                {linePreview.applied_promotion.title} applied
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {lineDiscount > 0 && (
                              <p className="text-xs text-[#E7D2B6]/45 line-through">
                                Rs. {baseLineTotal.toLocaleString()}
                              </p>
                            )}
                              <p className="text-sm font-bold text-[#C98A5A]">
                                Rs. {discountedLineTotal.toLocaleString()}
                              </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(pricingPreview.applied_promotions?.length > 0 || pricingLoading || pricingError) && (
                  <div className="mt-6 rounded-[1.5rem] border border-[#8B5A2B]/16 bg-[#0F0A08]/52 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[#E7D2B6]/55">
                        Active offers
                      </span>
                      {pricingLoading && (
                        <span className="text-xs text-[#D7B38A]">Checking best promotions...</span>
                      )}
                    </div>

                    {pricingError ? (
                      <p className="mt-3 text-sm text-amber-300">{pricingError}</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {(pricingPreview.applied_promotions || []).map((promotion) => (
                          <div
                            key={promotion.promotion_id}
                            className="flex items-center justify-between rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-semibold text-[#F6E7D0]">{promotion.title}</p>
                              <p className="text-xs text-[#E7D2B6]/58 capitalize">
                                {promotion.application_type === 'order'
                                  ? 'Order discount'
                                  : promotion.application_type === 'item'
                                    ? 'Item discount'
                                    : 'Buy x get y'}
                              </p>
                              {Number(promotion.bonus_quantity || 0) > 0 && (
                                <p className="mt-1 text-xs font-semibold text-emerald-300">
                                  {Number(promotion.bonus_quantity)} free item{Number(promotion.bonus_quantity) > 1 ? 's' : ''} added
                                </p>
                              )}
                            </div>
                            <p className="text-sm font-bold text-emerald-300">
                              - Rs. {Number(promotion.discount || 0).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!pricingLoading && !pricingError && (pricingPreview.applied_promotions?.length || 0) === 0 && (
                  <div className="mt-6 rounded-[1.5rem] border border-[#8B5A2B]/16 bg-[#0F0A08]/52 px-5 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#E7D2B6]/55">
                      Promotions
                    </p>
                    <p className="mt-3 text-sm text-[#E7D2B6]/65">
                      No active promotion matches this cart right now. Discounts apply only when the offer is active for the current date and the selected items match its rules.
                    </p>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#8B5A2B]/16 bg-[#0F0A08]/48 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#E7D2B6]/42">Service style</p>
                    <p className="mt-2 text-xl font-bold text-[#F6E7D0] capitalize">
                      {formData.order_type.replace('-', ' ')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#8B5A2B]/16 bg-[#0F0A08]/48 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#E7D2B6]/42">Payment</p>
                    <p className="mt-2 text-xl font-bold text-[#F6E7D0] capitalize">
                      {formData.payment_method}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-[#8B5A2B]/16 bg-[#0F0A08]/52 px-5 py-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-[#E7D2B6]/65">
                      <span>Subtotal</span>
                      <span>Rs. {subtotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-emerald-300">
                      <span>Promotions</span>
                      <span>- Rs. {discountAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#8B5A2B]/16 pt-3">
                      <span className="text-lg font-semibold text-[#E7D2B6]">Total due</span>
                      <span className="text-3xl font-bold text-[#C98A5A]">Rs. {payableTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[1.75rem] border border-[#8B5A2B]/28 bg-[linear-gradient(160deg,rgba(26,17,13,0.97),rgba(30,20,15,0.93))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8"
            >
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#E7D2B6]/45">Guest details</p>
                  <h2 className="mt-2 text-3xl font-bold text-[#F6E7D0]">Reservation-style checkout</h2>
                </div>
                <p className="max-w-sm text-sm text-[#E7D2B6]/58">
                  Fill out the essentials and we will take the order from kitchen to table.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                  minLength={2}
                  maxLength={100}
                  className={fieldClassName}
                />

                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  required
                  pattern="(?:\+94|0)\d{9}"
                  maxLength={12}
                  className={fieldClassName}
                />

                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  maxLength={255}
                  className={`md:col-span-2 ${fieldClassName}`}
                />
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-[1.5rem] border border-[#8B5A2B]/18 bg-[#0F0A08]/45 p-5">
                  <h3 className="text-lg font-semibold text-[#F6E7D0]">How should we serve it?</h3>
                  <div className="mt-4 grid gap-3">
                    {[
                      { value: 'dine-in', label: 'Dine In', note: 'Prepared for your table experience.' },
                      { value: 'takeaway', label: 'Takeaway', note: 'Packed neatly for quick pickup.' },
                      { value: 'delivery', label: 'Delivery', note: 'Delivered to your doorstep with care.' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-2xl border px-4 py-4 transition ${
                          formData.order_type === option.value
                            ? 'border-[#D7B38A]/45 bg-[#D7B38A]/12'
                            : 'border-[#8B5A2B]/16 bg-[#140D0A]/55 hover:border-[#8B5A2B]/35'
                        }`}
                      >
                        <input
                          type="radio"
                          name="order_type"
                          value={option.value}
                          checked={formData.order_type === option.value}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <p className="font-semibold text-[#F6E7D0]">{option.label}</p>
                        <p className="mt-1 text-sm text-[#E7D2B6]/58">{option.note}</p>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#8B5A2B]/18 bg-[#0F0A08]/45 p-5">
                  <h3 className="text-lg font-semibold text-[#F6E7D0]">Payment preference</h3>
                  <div className="mt-4 grid gap-3">
                    {[
                      { value: 'cash', label: 'Cash', note: 'Pay when the order reaches you.' },
                      { value: 'card', label: 'Card', note: 'Use your credit or debit card details.' },
                      { value: 'online', label: 'Online', note: 'Upload your transfer receipt instead of entering card details.' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-2xl border px-4 py-4 transition ${
                          formData.payment_method === option.value
                            ? 'border-[#D7B38A]/45 bg-[#D7B38A]/12'
                            : 'border-[#8B5A2B]/16 bg-[#140D0A]/55 hover:border-[#8B5A2B]/35'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value={option.value}
                          checked={formData.payment_method === option.value}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <p className="font-semibold capitalize text-[#F6E7D0]">{option.label}</p>
                        <p className="mt-1 text-sm text-[#E7D2B6]/58">{option.note}</p>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {formData.order_type === 'delivery' && (
                <div className="mt-6">
                  <textarea
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleChange}
                    placeholder="Delivery Address"
                    required
                    minLength={10}
                    maxLength={255}
                    className={`${fieldClassName} min-h-28`}
                  />
                </div>
              )}

              <div className="mt-6">
                <textarea
                  name="special_instructions"
                  value={formData.special_instructions}
                  onChange={handleChange}
                  placeholder="Special Instructions (optional)"
                  maxLength={500}
                  className={`${fieldClassName} min-h-28`}
                />
              </div>

              {formData.payment_method === 'card' && (
                <div className="mt-8 rounded-[1.5rem] border border-[#8B5A2B]/18 bg-[#0F0A08]/45 p-5">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#F6E7D0]">Payment Details</h3>
                      <p className="mt-1 text-sm text-[#E7D2B6]/58">Enter your card information securely.</p>
                    </div>
                    {cardInfo.isValidating && (
                      <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold ${
                        cardInfo.isValid
                          ? 'bg-emerald-500/12 text-emerald-300'
                          : 'bg-red-500/10 text-red-300'
                      }`}>
                        {cardInfo.isValid ? 'Card looks valid' : 'Card needs attention'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <select
                      name="card_type"
                      value={formData.card_type}
                      onChange={handleChange}
                      required={formData.payment_method !== 'cash'}
                      className={fieldClassName}
                    >
                      <option value="">Select Card Type</option>
                      <option value="visa">Visa</option>
                      <option value="mastercard">MasterCard</option>
                      <option value="amex">American Express</option>
                      <option value="discover">Discover</option>
                      <option value="jcb">JCB</option>
                      <option value="diners">Diners Club</option>
                      <option value="other">Other</option>
                    </select>

                    <input
                      type="text"
                      name="card_name"
                      value={formData.card_name}
                      onChange={handleChange}
                      placeholder="Cardholder Name"
                      required={formData.payment_method !== 'cash'}
                      maxLength="255"
                      className={fieldClassName}
                    />

                    <div className="relative">
                      <input
                        type="text"
                        name="card_number"
                        value={formData.card_number}
                        onChange={handleChange}
                        placeholder="Card Number"
                        required={formData.payment_method !== 'cash'}
                        maxLength="19"
                        className={`${fieldClassName} pr-14`}
                      />
                      {cardInfo.isValidating && (
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 transform">
                          {cardInfo.isValid ? (
                            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : formData.card_number.replace(/\s/g, '').length >= 4 ? (
                            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <select
                        name="expiry_month"
                        value={formData.expiry_month}
                        onChange={handleChange}
                        required={formData.payment_method !== 'cash'}
                        className={fieldClassName}
                      >
                        <option value="">Month</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = (i + 1).toString().padStart(2, '0');
                          return (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          );
                        })}
                      </select>

                      <select
                        name="expiry_year"
                        value={formData.expiry_year}
                        onChange={handleChange}
                        required={formData.payment_method !== 'cash'}
                        className={fieldClassName}
                      >
                        <option value="">Year</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = (new Date().getFullYear() + i).toString();
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>

                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        placeholder="CVV"
                        required={formData.payment_method !== 'cash'}
                        maxLength="4"
                        pattern="\d{3,4}"
                        className={fieldClassName}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.payment_method === 'online' && (
                <div className="mt-8 rounded-[1.5rem] border border-[#8B5A2B]/18 bg-[#0F0A08]/45 p-5">
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold text-[#F6E7D0]">Upload Payment Receipt</h3>
                    <p className="mt-1 text-sm text-[#E7D2B6]/58">
                      For online payment, upload the bank slip or payment confirmation receipt. Card details are not required here.
                    </p>
                  </div>

                  <label className="block rounded-2xl border border-dashed border-[#D7B38A]/35 bg-[#140D0A]/55 p-5 text-center transition hover:border-[#D7B38A]/55">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleReceiptChange}
                      className="hidden"
                    />
                    <p className="text-base font-semibold text-[#F6E7D0]">
                      {paymentReceipt ? paymentReceipt.name : 'Choose receipt file'}
                    </p>
                    <p className="mt-2 text-sm text-[#E7D2B6]/58">
                      Accepted formats: JPG, PNG, PDF. Maximum size: 5MB.
                    </p>
                  </label>

                  {paymentReceipt && (
                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      Receipt selected successfully. We will attach it to your order.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="rounded-2xl border border-[#8B5A2B]/35 px-5 py-4 font-semibold text-[#E7D2B6] transition hover:bg-[#8B5A2B]/12"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[#C98A5A] to-[#D4A574] px-5 py-4 text-lg font-bold text-[#0F0A08] shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <CustomerAuthModal
        isOpen={showAuthModal && !isAuthenticated()}
        onClose={() => {
          setShowAuthModal(false);
          navigate('/cart');
        }}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
        title="Continue to Checkout"
        description="Log in or create an account to continue with your order."
      />
    </CustomerLayout>
  );
};

export default CheckoutPage;


