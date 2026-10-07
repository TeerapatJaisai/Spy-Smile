import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminScreen() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const role = window.localStorage.getItem('role');

      if (role?.trim().toLowerCase() === 'admin') {
        setIsAdmin(true);
      } else {
        Alert.alert(
          'ไม่มีสิทธิ์',
          'หน้านี้สำหรับ Admin เท่านั้น',
          [
            {
              text: 'ตกลง',
              onPress: () => router.replace('/'),
            },
          ]
        );
      }
    }
  }, []);

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#050507"
        />

        <View style={styles.center}>
          <MaterialCommunityIcons
            name="shield-lock"
            size={60}
            color="#A78BFA"
          />

          <Text style={styles.noAccess}>
            Admin Only
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const adminMenus = [
    {
      title: 'Dashboard',
      subtitle: 'ยอดขาย กำไร และ Stock',
      icon: 'chart-box-outline',
      route: '/dashboard',
    },
    {
      title: 'Product Management',
      subtitle: 'เพิ่ม แก้ไข และลบสินค้า',
      icon: 'package-variant-closed',
      route: '/product',
    },
    {
      title: 'Purchase Order',
      subtitle: 'สั่งสินค้าเข้าคลัง',
      icon: 'clipboard-list-outline',
      route: '/purchase-order',
    },
    {
      title: 'Claim Management',
      subtitle: 'จัดการคำขอเคลมสินค้า',
      icon: 'shield-check-outline',
      route: '/claim-admin',
    },
    {
      title: 'Shipping Management',
      subtitle: 'จัดการสถานะการจัดส่ง',
      icon: 'truck-outline',
      route: '/admin-shipping',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#050507"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>
            ADMIN PANEL
          </Text>

          <Text style={styles.headerSubtitle}>
            Management Center
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Profile */}
        <View style={styles.adminCard}>
          <View style={styles.adminIcon}>
            <MaterialCommunityIcons
              name="crown"
              size={28}
              color="#A78BFA"
            />
          </View>

          <View>
            <Text style={styles.adminText}>
              Administrator
            </Text>

            <Text style={styles.adminSubText}>
              Manage your IT Shop
            </Text>
          </View>
        </View>

        {/* MENU */}
        <Text style={styles.sectionTitle}>
          MANAGEMENT
        </Text>

        {adminMenus.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.menuCard}
            activeOpacity={0.8}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={28}
                color="#A78BFA"
              />
            </View>

            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>
                {item.title}
              </Text>

              <Text style={styles.menuSubtitle}>
                {item.subtitle}
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={25}
              color="#666673"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050507',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  noAccess: {
    marginTop: 15,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,

    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(8,8,12,0.96)',
  },

  backButton: {
    width: 42,
    height: 42,

    borderRadius: 14,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: '#15151C',

    marginRight: 14,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  headerSubtitle: {
    marginTop: 3,
    color: '#777783',
    fontSize: 12,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 18,
    marginBottom: 25,

    borderRadius: 22,

    backgroundColor: '#101016',

    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
  },

  adminIcon: {
    width: 58,
    height: 58,

    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'rgba(167,139,250,0.10)',

    marginRight: 14,
  },

  adminText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  adminSubText: {
    marginTop: 4,
    color: '#777783',
    fontSize: 12,
  },

  sectionTitle: {
    color: '#777783',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,

    marginBottom: 12,
    marginLeft: 4,
  },

  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',

    minHeight: 86,

    paddingHorizontal: 14,
    paddingVertical: 12,

    marginBottom: 12,

    borderRadius: 20,

    backgroundColor: '#101016',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  iconBox: {
    width: 54,
    height: 54,

    borderRadius: 16,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'rgba(167,139,250,0.08)',

    marginRight: 14,
  },

  menuInfo: {
    flex: 1,
  },

  menuTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  menuSubtitle: {
    marginTop: 5,
    color: '#777783',
    fontSize: 11,
  },
});