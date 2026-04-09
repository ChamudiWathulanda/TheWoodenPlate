import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';

const WishlistContext = createContext(null);

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { customer, loading } = useCustomerAuth();
  const guestStorageKey = 'customer_wishlist_items_guest';
  const guestBackupStorageKey = 'customer_wishlist_items_guest_backup';
  const storageKey = useMemo(() => {
    return customer?.id ? `customer_wishlist_items_${customer.id}` : guestStorageKey;
  }, [customer?.id]);

  const readWishlist = (key) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load wishlist from localStorage', error);
      return [];
    }
  };

  const writeWishlist = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save wishlist to localStorage', error);
    }
  };

  const mergeWishlistItems = (baseItems, incomingItems) => {
    const mergedMap = new Map();

    [...baseItems, ...incomingItems].forEach((item) => {
      if (!mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    });

    return Array.from(mergedMap.values());
  };

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (customer?.id) {
      const guestItems = readWishlist(guestStorageKey);
      const customerItems = readWishlist(storageKey);
      const mergedItems = mergeWishlistItems(customerItems, guestItems);

      setItems(mergedItems);

      if (guestItems.length > 0) {
        writeWishlist(guestBackupStorageKey, guestItems);
      }
      writeWishlist(storageKey, mergedItems);

      if (guestItems.length > 0) {
        localStorage.removeItem(guestStorageKey);
      }
      return;
    }

    const guestItems = readWishlist(guestStorageKey);
    if (guestItems.length > 0) {
      setItems(guestItems);
      return;
    }

    const backupGuestItems = readWishlist(guestBackupStorageKey);
    if (backupGuestItems.length > 0) {
      setItems(backupGuestItems);
      writeWishlist(guestStorageKey, backupGuestItems);
      return;
    }

    setItems([]);
  }, [customer?.id, guestBackupStorageKey, guestStorageKey, loading, storageKey]);

  useEffect(() => {
    if (loading) {
      return;
    }

    writeWishlist(storageKey, items);

    if (!customer?.id) {
      writeWishlist(guestBackupStorageKey, items);
    }
  }, [customer?.id, guestBackupStorageKey, items, loading, storageKey]);

  const isInWishlist = (id) => items.some((item) => item.id === id);

  const addItem = (item) => {
    setItems((prev) => {
      if (prev.some((wishlistItem) => wishlistItem.id === item.id)) {
        return prev;
      }

      return [...prev, item];
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleItem = (item) => {
    if (isInWishlist(item.id)) {
      removeItem(item.id);
      return false;
    }

    addItem(item);
    return true;
  };

  const clearWishlist = () => setItems([]);

  const value = {
    items,
    itemCount: items.length,
    addItem,
    removeItem,
    toggleItem,
    clearWishlist,
    isInWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export default WishlistContext;
