import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '../customer/layout/customerLayout';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import axios from 'axios';

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const { customer, loading: authLoading, isAuthenticated } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated()) {
      navigate('/login', {
        replace: true,
        state: {
          authMessage: 'Please log in to view your orders.',
          redirectTo: '/my-orders',
        },
      });
      return;
    }

    fetchOrders();
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (authLoading || !isAuthenticated()) {
      return undefined;
    }

    const intervalId = window.setInterval(fetchOrders, 15000);
    return () => window.clearInterval(intervalId);
  }, [authLoading, isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/customer/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        navigate('/login', {
          replace: true,
          state: {
            authMessage: 'Your session expired. Please log in again to view your order history.',
            redirectTo: '/my-orders',
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
      preparing: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
      ready: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
      completed: 'border-[#D7B38A]/20 bg-[#D7B38A]/10 text-[#F4E5CF]',
      cancelled: 'border-red-400/20 bg-red-500/10 text-red-200'
    };
    return colors[status] || 'border-[#D7B38A]/20 bg-[#D7B38A]/10 text-[#F4E5CF]';
  };

  const activeOrders = orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total ?? order.total_amount ?? 0), 0);
  const latestOrder = orders[0];

  if (loading || authLoading) {
    return (
      <CustomerLayout>
        <div className="flex min-h-screen items-center justify-center bg-[#0F0A08]">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#C98A5A]"></div>
            <p className="mt-4 text-[#E7D2B6]/72">Loading orders...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#3b2418_0%,#1a110d_35%,#0f0a08_70%)] px-4 pt-32 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 rounded-[2rem] border border-[#8B5A2B]/35 bg-[#1A110D]/82 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.42)] backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-3 inline-flex items-center rounded-full border border-[#D7B38A]/25 bg-[#D7B38A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#D7B38A]">
                  Order timeline
                </p>
                <h1 className="text-4xl font-bold text-[#F6E7D0] sm:text-5xl">My Orders</h1>
                <p className="mt-4 max-w-2xl text-base text-[#E7D2B6]/72 sm:text-lg">
                  Welcome back, <span className="font-semibold text-[#F6E7D0]">{customer?.name}</span>. Track every plate from order placed to served.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#8B5A2B]/25 bg-[#0F0A08]/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#E7D2B6]/45">Total orders</p>
                  <p className="mt-2 text-3xl font-bold text-[#F6E7D0]">{orders.length}</p>
                </div>
                <div className="rounded-2xl border border-[#8B5A2B]/25 bg-[#0F0A08]/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#E7D2B6]/45">Active</p>
                  <p className="mt-2 text-3xl font-bold text-[#F6E7D0]">{activeOrders}</p>
                </div>
                <div className="rounded-2xl border border-[#8B5A2B]/25 bg-[#0F0A08]/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#E7D2B6]/45">Spent</p>
                  <p className="mt-2 text-2xl font-bold text-[#F6E7D0]">Rs. {totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {latestOrder && (
              <div className="mt-6 rounded-[1.5rem] border border-[#8B5A2B]/22 bg-[#0F0A08]/58 px-5 py-4 text-sm text-[#E7D2B6]/72">
                Latest order:
                <span className="ml-2 font-semibold text-[#F6E7D0]">
                  #{latestOrder.order_number || latestOrder.id}
                </span>
                <span className="ml-2">
                  placed on {new Date(latestOrder.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="rounded-[2rem] border border-[#8B5A2B]/30 bg-[#1A110D]/88 p-12 text-center shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
              <svg className="mx-auto h-12 w-12 text-[#D7B38A]/55" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-4 text-2xl font-semibold text-[#F6E7D0]">No orders yet</h3>
              <p className="mt-2 text-sm text-[#E7D2B6]/68">Start ordering delicious food from our menu!</p>
              <div className="mt-6">
                <Link
                  to="/menu"
                  className="inline-flex items-center rounded-full bg-[#C98A5A] px-5 py-3 text-sm font-semibold text-[#0F0A08] transition hover:bg-[#D4A574]"
                >
                  Browse Menu
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-[2rem] border border-[#8B5A2B]/28 bg-[linear-gradient(145deg,rgba(26,17,13,0.96),rgba(47,31,23,0.92))] shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
                >
                  <div className="p-6">
                    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-2xl font-semibold text-[#F6E7D0]">
                          Order #{order.order_number || order.id}
                        </h3>
                        <p className="mt-2 text-sm text-[#E7D2B6]/62">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${getStatusColor(order.status)}`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </div>

                    <div className="border-t border-[#8B5A2B]/22 pt-5">
                      <div className="space-y-2">
                        {order.items && order.items.map((item, index) => {
                          const quantity = Number(item.quantity ?? 0);
                          const unitPrice = Number(item.price ?? 0);
                          const lineSubtotal = Number(item.subtotal ?? unitPrice * quantity);
                          const paidQuantityEstimate = unitPrice > 0 ? lineSubtotal / unitPrice : quantity;
                          const roundedPaidQuantity = Math.round(paidQuantityEstimate);
                          const hasWholePaidQuantity =
                            unitPrice > 0 && Math.abs(paidQuantityEstimate - roundedPaidQuantity) < 0.001;
                          const bonusQuantity =
                            hasWholePaidQuantity && roundedPaidQuantity < quantity
                              ? quantity - roundedPaidQuantity
                              : 0;

                          return (
                            <div
                              key={index}
                              className="flex justify-between gap-3 rounded-2xl border border-[#8B5A2B]/16 bg-[#0F0A08]/45 px-4 py-3 text-sm"
                            >
                              <div className="text-[#E7D2B6]/72">
                                <p>{quantity}x {item.product?.name || item.name || 'Item'}</p>
                                {bonusQuantity > 0 && (
                                  <p className="mt-1 text-xs font-semibold text-emerald-300">
                                    Includes {bonusQuantity} free item{bonusQuantity > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                              <span className="font-medium text-[#F6E7D0]">
                                Rs. {lineSubtotal.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-[#8B5A2B]/22 pt-5">
                        <span className="text-base font-semibold text-[#F6E7D0]">Total</span>
                        <span className="text-2xl font-bold text-[#C98A5A]">
                          Rs. {Number(order.total ?? order.total_amount ?? 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {order.order_type && (
                          <div className="rounded-2xl border border-[#8B5A2B]/16 bg-[#0F0A08]/45 px-4 py-3 text-sm text-[#E7D2B6]/72">
                            <span className="font-medium text-[#F6E7D0]">Type:</span> {order.order_type}
                          </div>
                        )}

                        <div className="rounded-2xl border border-[#8B5A2B]/16 bg-[#0F0A08]/45 px-4 py-3 text-sm text-[#E7D2B6]/72">
                          <span className="font-medium text-[#F6E7D0]">Payment:</span> {order.payment_method || 'N/A'} ({order.payment_status || 'pending'})
                        </div>

                        {order.delivery_address && (
                          <div className="rounded-2xl border border-[#8B5A2B]/16 bg-[#0F0A08]/45 px-4 py-3 text-sm text-[#E7D2B6]/72 md:col-span-2">
                            <span className="font-medium text-[#F6E7D0]">Delivery Address:</span> {order.delivery_address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default MyOrdersPage;
