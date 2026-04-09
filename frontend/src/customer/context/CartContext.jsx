import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
	const { customer, loading } = useCustomerAuth();
	const guestStorageKey = 'customer_cart_items_guest';
	const guestBackupStorageKey = 'customer_cart_items_guest_backup';
	const storageKey = useMemo(() => {
		return customer?.id ? `customer_cart_items_${customer.id}` : guestStorageKey;
	}, [customer?.id]);

	const readCart = (key) => {
		try {
			const stored = localStorage.getItem(key);
			return stored ? JSON.parse(stored) : [];
		} catch (e) {
			console.warn('Failed to load cart from localStorage', e);
			return [];
		}
	};

	const writeCart = (key, value) => {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (e) {
			console.warn('Failed to save cart to localStorage', e);
		}
	};

	const mergeCartItems = (baseItems, incomingItems) => {
		const mergedMap = new Map();

		[...baseItems, ...incomingItems].forEach((item) => {
			const existing = mergedMap.get(item.id);

			if (existing) {
				mergedMap.set(item.id, {
					...existing,
					quantity: (existing.quantity || 0) + (item.quantity || 0),
				});
				return;
			}

			mergedMap.set(item.id, { ...item, quantity: item.quantity || 1 });
		});

		return Array.from(mergedMap.values());
	};

	const [items, setItems] = useState([]);

	useEffect(() => {
		if (loading) {
			return;
		}

		if (customer?.id) {
			const guestItems = readCart(guestStorageKey);
			const customerItems = readCart(storageKey);
			const mergedItems = mergeCartItems(customerItems, guestItems);

			setItems(mergedItems);

			try {
				if (guestItems.length > 0) {
					writeCart(guestBackupStorageKey, guestItems);
				}
				writeCart(storageKey, mergedItems);
				if (guestItems.length > 0) {
					localStorage.removeItem(guestStorageKey);
				}
			} catch (e) {
				console.warn('Failed to migrate cart in localStorage', e);
			}
			return;
		}

		const guestItems = readCart(guestStorageKey);
		if (guestItems.length > 0) {
			setItems(guestItems);
			return;
		}

		const backupGuestItems = readCart(guestBackupStorageKey);
		if (backupGuestItems.length > 0) {
			setItems(backupGuestItems);
			writeCart(guestStorageKey, backupGuestItems);
			return;
		}

		setItems([]);
	}, [customer?.id, guestBackupStorageKey, guestStorageKey, loading, storageKey]);

	const addItem = (item) => {
		const existing = items.find((i) => i.id === item.id);
		setItems((prev) => {
			const existing = prev.find(i => i.id === item.id);
			if (existing) {
				return prev.map(i => 
					i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
				);
			} else {
				return [...prev, { ...item, quantity: 1 }];
			}
		});

		toast.success(
			existing ? `${item.name} quantity updated in cart` : `${item.name} added to cart`,
			{
				icon: '🛒',
			}
		);
	};

	const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
	const updateQuantity = (id, quantity) => {
		if (quantity <= 0) {
			removeItem(id);
		} else {
			setItems((prev) => prev.map(i => i.id === id ? { ...i, quantity } : i));
		}
	};
	const clearCart = () => setItems([]);

	useEffect(() => {
		if (loading) {
			return;
		}

		writeCart(storageKey, items);

		if (!customer?.id) {
			writeCart(guestBackupStorageKey, items);
		}
	}, [customer?.id, guestBackupStorageKey, items, loading, storageKey]);

	const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
	const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

	const value = { items, itemCount, total, addItem, removeItem, updateQuantity, clearCart };

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
