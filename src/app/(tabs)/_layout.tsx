import { Tabs } from 'expo-router';
import {
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

export default function TabLayout() {
  const [isAdmin, setIsAdmin] =
    useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const role =
        window.localStorage.getItem('role');

      setIsAdmin(
        role?.trim().toLowerCase() === 'admin'
      );
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // ============================================
        // BOTTOM BAR
        // ============================================

        tabBarStyle: {
          backgroundColor: '#050507',

          borderTopWidth: 1,

          borderTopColor:
            'rgba(255,255,255,0.08)',

          height:
            Platform.OS === 'ios'
              ? 78
              : 68,

          paddingTop: 6,

          paddingBottom:
            Platform.OS === 'ios'
              ? 18
              : 7,

          paddingHorizontal: 5,
        },

        // ============================================
        // COLORS
        // ============================================

        tabBarActiveTintColor:
          '#FFFFFF',

        tabBarInactiveTintColor:
          '#666A73',

        // ============================================
        // LABEL
        // ============================================

        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginTop: 2,
        },

        // ============================================
        // FULL WIDTH
        // ============================================

        tabBarItemStyle: {
          flex: 1,
          paddingHorizontal: 0,
          marginHorizontal: 0,
        },

        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >

      {/* ================================================== */}
      {/* HOME */}
      {/* ================================================== */}

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',

          tabBarIcon: ({
            focused,
          }) => (
            <BottomIcon
              icon="home-outline"
              focused={focused}
            />
          ),
        }}
      />


      {/* ================================================== */}
      {/* PRODUCTS */}
      {/* User + Admin เห็น */}
      {/* ================================================== */}

      <Tabs.Screen
        name="product"
        options={{
          title: 'Products',

          tabBarIcon: ({
            focused,
          }) => (
            <BottomIcon
              icon="storefront-outline"
              focused={focused}
            />
          ),
        }}
      />


      {/* ================================================== */}
      {/* CART */}
      {/* ================================================== */}

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',

          tabBarIcon: ({
            focused,
          }) => (
            <BottomIcon
              icon="cart-outline"
              focused={focused}
            />
          ),
        }}
      />


      {/* ================================================== */}
      {/* ORDERS */}
      {/* ================================================== */}

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',

          tabBarIcon: ({
            focused,
          }) => (
            <BottomIcon
              icon="package-variant-closed"
              focused={focused}
            />
          ),
        }}
      />


      {/* ================================================== */}
      {/* SHIPPING */}
      {/* ================================================== */}

      <Tabs.Screen
        name="shipping"
        options={{
          title: 'Shipping',

          tabBarIcon: ({
            focused,
          }) => (
            <BottomIcon
              icon="truck-outline"
              focused={focused}
            />
          ),
        }}
      />


      {/* ================================================== */}
      {/* PROFILE */}
      {/* ================================================== */}

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',

          tabBarIcon: ({
            focused,
          }) => (
            <BottomIcon
              icon="account-outline"
              focused={focused}
            />
          ),
        }}
      />


      {/* ================================================== */}
      {/* CLAIM */}
      {/* User + Admin เห็น */}
      {/* ================================================== */}

      <Tabs.Screen
        name="claim"
        options={{
          title: 'Claim',

          tabBarIcon: ({
            focused,
          }) => (
            <BottomIcon
              icon="shield-check-outline"
              focused={focused}
            />
          ),
        }}
      />


      {/* ================================================== */}
      {/* CLAIM ADMIN */}
      {/* Admin เท่านั้น */}
      {/* ================================================== */}

      <Tabs.Screen
        name="claim-admin"
        options={{
          title: 'Claim Admin',

          tabBarButton:
            isAdmin
              ? undefined
              : () => null,

          tabBarIcon: ({
            focused,
          }) => (
            <BottomIcon
              icon="crown-outline"
              focused={focused}
            />
          ),
        }}
      />


      {/* ================================================== */}
      {/* DASHBOARD */}
      {/* Admin เท่านั้น */}
      {/* ================================================== */}

      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',

          tabBarButton:
            isAdmin
              ? undefined
              : () => null,

          tabBarIcon: ({
            focused,
          }) => (
            <BottomIcon
              icon="chart-box-outline"
              focused={focused}
            />
          ),
        }}
      />

    </Tabs>
  );
}


// ============================================================
// BOTTOM ICON
// ============================================================

function BottomIcon({
  icon,
  focused,
}: {
  icon:
    keyof typeof MaterialCommunityIcons.glyphMap;

  focused: boolean;
}) {
  return (
    <View
      style={[
        styles.iconWrapper,

        focused &&
          styles.iconWrapperActive,
      ]}
    >

      {/* ================================================ */}
      {/* ACTIVE GLOW */}
      {/* ================================================ */}

      {focused && (
        <View
          style={
            styles.activeGlow
          }
        />
      )}


      {/* ================================================ */}
      {/* ICON */}
      {/* ================================================ */}

      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={
          focused
            ? '#FFFFFF'
            : '#777B85'
        }
      />

    </View>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  // ----------------------------------------------------------
  // ICON WRAPPER
  // ----------------------------------------------------------

  iconWrapper: {
    width: 38,
    height: 34,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    position: 'relative',

    backgroundColor:
      'rgba(255,255,255,0.02)',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.04)',
  },


  // ----------------------------------------------------------
  // ACTIVE ICON
  // ----------------------------------------------------------

  iconWrapperActive: {
    backgroundColor:
      'rgba(82,75,220,0.18)',

    borderColor:
      'rgba(110,100,255,0.55)',

    shadowColor:
      '#6258FF',

    shadowOpacity: 0.55,

    shadowRadius: 10,

    elevation: 6,
  },


  // ----------------------------------------------------------
  // ACTIVE GLOW
  // ----------------------------------------------------------

  activeGlow: {
    position: 'absolute',

    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor:
      'rgba(92,80,255,0.12)',

    shadowColor:
      '#6C5CFF',

    shadowOpacity: 0.85,

    shadowRadius: 14,
  },

});