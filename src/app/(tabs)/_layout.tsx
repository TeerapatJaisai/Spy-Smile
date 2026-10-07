import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const role = window.localStorage.getItem('role');

      setIsAdmin(
        role?.trim().toLowerCase() === 'admin'
      );
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // ======================================
        // สีเดิม
        // ======================================
        tabBarActiveTintColor: 'rgb(102, 192, 244)',
        tabBarInactiveTintColor: 'rgb(119, 185, 240)',

        tabBarStyle: {
          backgroundColor: '#101314',
          borderTopColor: '#2a466d',
          borderTopWidth: 1,

          height: 72,

          paddingTop: 5,
          paddingBottom: 8,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },

        tabBarItemStyle: {
          flex: 1,
        },
      }}
    >

      {/* ======================================
          USER + ADMIN
          ====================================== */}

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="home-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="product"
        options={{
          title: 'Product',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="storefront-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="cart-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Order',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="package-variant-closed"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="shipping"
        options={{
          title: 'Shipping',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="truck-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="claim"
        options={{
          title: 'Claim',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="shield-check-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="account-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* ======================================
          ADMIN ONLY
          ====================================== */}

      <Tabs.Screen
        name="claim-admin"
        options={{
          title: 'Claim Admin',

          href: isAdmin
            ? '/claim-admin'
            : null,

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="crown-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',

          href: isAdmin
            ? '/dashboard'
            : null,

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="chart-box-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* ======================================
          PURCHASE ORDER ⭐
          ====================================== */}

      <Tabs.Screen
        name="purchase-order"
        options={{
          title: 'Purchase Order',

          href: isAdmin
            ? '/purchase-order'
            : null,

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* ======================================
          ADMIN SHIPPING
          ====================================== */}

      <Tabs.Screen
        name="admin-shipping"
        options={{
          title: 'Admin Shipping',

          href: isAdmin
            ? '/admin-shipping'
            : null,

          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialCommunityIcons
              name="truck-check-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

    </Tabs>
  );
}