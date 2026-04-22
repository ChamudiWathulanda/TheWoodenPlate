import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomerLayout from '../layout/customerLayout';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import CustomerAuthModal from '../components/CustomerAuthModal';

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const { items, total, removeItem, updateQuantity, clearCart } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pricingPreview, setPricingPreview] = useState({
    subtotal: total,
    discount: 0,
    total,
    applied_promotions: [],
    line_items: [],
  });
  const [pricingLoading, setPricingLoading] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedReady = totalItems > 6 ? '25-35 mins' : '15-25 mins';

  const previewLineItems = useMemo(
    () => new Map((pricingPreview.line_items || []).map((line) => [line.menu_item_id, line])),
    [pricingPreview.line_items]
  );

  const totalFreeItems = (pricingPreview.line_items || []).reduce(
    (sum, line) => sum + Number(line.bonus_quantity ?? 0),
    0
  );
  const subtotalAmount = Number(pricingPreview.subtotal ?? total);
  const discountAmount = Number(pricingPreview.discount ?? 0);
  const payableTotal = Number(pricingPreview.total ?? total);

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

  const handleProceedToCheckout = () => {
    if (isAuthenticated()) {
      navigate('/checkout');
      return;
    }

    setShowAuthModal(true);
  };

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="min-h-[70vh] flex items-center justify-center px-4 pt-32 pb-12 sm:px-6">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#8B5A2B]/30 bg-[#1A110D]">
              <span className="text-4xl">Cart</span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-[#E7D2B6]">Your cart is empty</h1>
            <p className="mb-8 text-[#E7D2B6]/70">
              Add some delicious items from our menu to get started!
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C98A5A] to-[#D4A574] px-8 py-4 font-semibold text-[#0F0A08] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-[#B07D4A] hover:to-[#C49A66] hover:shadow-xl"
            >
              <span>Menu</span>
              Browse Menu
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#3a2417_0%,#1a110d_34%,#0f0a08_72%)]">
        <div className="mx-auto max-w-7xl px-4 pt-32 pb-14 sm:px-6">
          <div className="mb-10 rounded-[2rem] border border-[#8B5A2B]/35 bg-[#1A110D]/80 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-3 inline-flex items-center rounded-full border border-[#D7B38A]/25 bg-[#D7B38A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-[#D7B38A]">
                  Ready to check out
                </p>
                <h1 className="text-4xl font-bold text-[#F6E7D0] sm:text-5xl">
                  Your cart, styled for the feast ahead.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-[#E7D2B6]/72 sm:text-lg">
                  Review every pick, adjust quantities in seconds, and move to checkout with a cleaner dining-flow experience.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-[#8B5A2B]/30 bg-[#0F0A08]/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#E7D2B6]/45">Items</p>
                  <p className="mt-2 text-3xl font-bold text-[#F6E7D0]">{totalItems}</p>
                </div>
                <div className="rounded-2xl border border-[#8B5A2B]/30 bg-[#0F0A08]/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#E7D2B6]/45">Est. ready</p>
                  <p className="mt-2 text-2xl font-bold text-[#F6E7D0]">{estimatedReady}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
            <div className="space-y-5">
              {items.map((item, index) => {
                const linePreview = previewLineItems.get(item.id);
                const bonusQuantity = Number(linePreview?.bonus_quantity ?? 0);
                const totalQuantity = Number(linePreview?.total_quantity ?? item.quantity);

                return (
                  <div
                    key={item.id}
                    className="group rounded-[1.75rem] border border-[#8B5A2B]/30 bg-[linear-gradient(135deg,rgba(26,17,13,0.95),rgba(48,30,21,0.92))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.32)] transition-all duration-300 hover:-translate-y-1 hover:border-[#C98A5A]/45"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center">
                      <div className="relative self-start">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-24 w-24 rounded-[1.25rem] border border-[#8B5A2B]/35 object-cover transition-colors duration-300 group-hover:border-[#C98A5A]/50"
                        />
                        <div className="absolute -top-2 -right-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#C98A5A] px-2 text-xs font-bold text-[#0F0A08]">
                          {item.quantity}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-[#F4E5CF]">{item.name}</h3>
                            <p className="mt-2 text-sm text-[#E7D2B6]/68">
                              Rs. {item.price.toLocaleString()} each
                            </p>
                            {bonusQuantity > 0 && (
                              <div className="mt-3 inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-500/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                Eligible free item: +{bonusQuantity} total free, {totalQuantity} served
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl border border-[#8B5A2B]/25 bg-[#0F0A08]/55 px-4 py-3 text-left lg:text-right">
                            <p className="text-xs uppercase tracking-[0.24em] text-[#E7D2B6]/45">Line total</p>
                            <p className="mt-1 text-2xl font-bold text-[#C98A5A]">
                              Rs. {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center rounded-2xl border border-[#8B5A2B]/30 bg-[#0F0A08]/75 p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex h-11 w-11 items-center justify-center rounded-xl text-lg text-[#E7D2B6] transition-colors duration-200 hover:bg-[#C98A5A] hover:text-[#0F0A08]"
                            >
                              -
                            </button>
                            <span className="w-14 text-center text-lg font-semibold text-[#E7D2B6]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-11 w-11 items-center justify-center rounded-xl text-lg text-[#E7D2B6] transition-colors duration-200 hover:bg-[#C98A5A] hover:text-[#0F0A08]"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm font-semibold text-red-300 transition-colors duration-200 hover:border-red-400/45 hover:bg-red-500/12"
                          >
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="xl:pl-2">
              <div className="sticky top-28 rounded-[1.75rem] border border-[#8B5A2B]/30 bg-[linear-gradient(180deg,rgba(26,17,13,0.96),rgba(19,13,10,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
                <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold text-[#E7D2B6]">
                  <span>Order</span>
                  Summary
                </h2>
                <p className="mb-6 text-sm text-[#E7D2B6]/62">
                  Everything in one glance before you place the order.
                </p>

                <div className="mb-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#8B5A2B]/25 bg-[#0F0A08]/65 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#E7D2B6]/45">Dishes</p>
                    <p className="mt-2 text-2xl font-bold text-[#F6E7D0]">{items.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[#8B5A2B]/25 bg-[#0F0A08]/65 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#E7D2B6]/45">Qty</p>
                    <p className="mt-2 text-2xl font-bold text-[#F6E7D0]">{totalItems}</p>
                  </div>
                </div>

                {(pricingLoading || totalFreeItems > 0) && (
                  <div className="mb-6 rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/75">Promotion preview</p>
                        <p className="mt-2 text-sm text-emerald-100">
                          {pricingLoading
                            ? 'Checking eligible free items...'
                            : `You currently qualify for ${totalFreeItems} free item${totalFreeItems > 1 ? 's' : ''}.`}
                        </p>
                      </div>
                      {!pricingLoading && totalFreeItems > 0 && (
                        <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100">
                          +{totalFreeItems} free
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-6 space-y-3">
                  {items.map((item) => {
                    const linePreview = previewLineItems.get(item.id);
                    const bonusQuantity = Number(linePreview?.bonus_quantity ?? 0);

                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-[#8B5A2B]/16 bg-[#0F0A08]/45 px-4 py-3 text-sm"
                      >
                        <div className="text-[#E7D2B6]/80">
                          <p>{item.name} x {item.quantity}</p>
                          {bonusQuantity > 0 && (
                            <p className="mt-1 text-xs font-semibold text-emerald-300">
                              +{bonusQuantity} free item{bonusQuantity > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-[#E7D2B6]">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <hr className="mb-6 border-[#8B5A2B]/30" />

                <div className="mb-8 rounded-[1.5rem] border border-[#8B5A2B]/16 bg-[#0F0A08]/52 px-5 py-4">
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
                      <span className="text-xl font-bold text-[#E7D2B6]">Total</span>
                      <span className="text-3xl font-bold text-[#C98A5A]">
                        Rs. {payableTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#C98A5A] to-[#D4A574] py-4 text-lg font-bold text-[#0F0A08] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-[#B07D4A] hover:to-[#C49A66]"
                  >
                    Proceed to Checkout
                  </button>

                  <button
                    onClick={() => navigate('/menu')}
                    className="w-full rounded-2xl border border-[#8B5A2B] bg-transparent py-3 font-semibold text-[#E7D2B6] transition-all duration-300 hover:bg-[#8B5A2B]/20"
                  >
                    Continue Shopping
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full rounded-2xl border border-red-500/30 bg-red-600/20 py-3 font-semibold text-red-400 transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/20"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          navigate('/checkout');
        }}
        title="Continue to Checkout"
        description="Log in or create an account to place your order without leaving this page."
      />
    </CustomerLayout>
  );
};

export default CartPage;
