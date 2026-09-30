import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_BASE_URL =
  'http://119.59.102.161:3100/api';

const { width, height } = Dimensions.get('window');

type ShippingOrder = {
  id: number;
  total_amount: string;
  status: string;
  tracking_number: string | null;
  shipping_date: string | null;
  estimated_delivery: string | null;
  shipping_address: string;
  created_at: string;
};

const STATUS_MAP: Record<
  string,
  {
    label: string;
    icon: string;
  }
> = {
  preparing: {
    label: 'กำลังเตรียมสินค้า',
    icon: '📦',
  },

  shipping: {
    label: 'กำลังจัดส่ง',
    icon: '🚚',
  },

  delivered: {
    label: 'จัดส่งสำเร็จ',
    icon: '✅',
  },
};

export default function ShippingScreen() {
  const [orders, setOrders] =
    useState<ShippingOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const fetchShipping = async () => {
    const userId =
      Platform.OS === 'web'
        ? window.localStorage.getItem('userId')
        : null;

    const role =
      Platform.OS === 'web'
        ? window.localStorage.getItem('role')
        : null;

    setIsAdmin(
      role?.trim().toLowerCase() === 'admin'
    );

    if (!userId) {
      router.replace('/login');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/shipping/${userId}`
      );

      if (response.ok) {
        const data =
          await response.json();

        setOrders(data);
      }
    } catch (error) {
      console.error(
        'FETCH SHIPPING ERROR:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchShipping();
    }, [])
  );

  const getStatus = (status: string) => {
    return (
      STATUS_MAP[status] || {
        label: status,
        icon: '📦',
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* =====================================================
          SPACE BACKGROUND
          ===================================================== */}

      <SpaceBackground />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#050507"
        />

        {/* =====================================================
            LOADING
            ===================================================== */}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color="#7C6CFF"
            />

            <Text style={styles.loadingText}>
              กำลังโหลดข้อมูลการจัดส่ง...
            </Text>
          </View>
        ) : (
          <>
            {/* =================================================
                HEADER
                ================================================= */}

            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>
                    🚚 การจัดส่ง
                  </Text>

                  <Text style={styles.headerSubtitle}>
                    ติดตามสถานะคำสั่งซื้อของคุณ
                  </Text>
                </View>

                {isAdmin && (
                  <TouchableOpacity
                    style={styles.adminButton}
                    onPress={() =>
                      router.replace(
                        '/admin-shipping'
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <View
                      style={styles.adminIconRow}
                    >
                      <MaterialCommunityIcons
                        name="clipboard-text-outline"
                        size={19}
                        color="#AFA7FF"
                      />

                      <MaterialCommunityIcons
                        name="truck-outline"
                        size={19}
                        color="#AFA7FF"
                      />
                    </View>

                    <Text
                      style={styles.adminButtonText}
                    >
                      Shipping Admin
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* =================================================
                CONTENT
                ================================================= */}

            <ScrollView
              contentContainerStyle={
                styles.content
              }
              showsVerticalScrollIndicator={false}
            >
              {orders.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text
                    style={styles.emptyIcon}
                  >
                    📦
                  </Text>

                  <Text
                    style={styles.emptyTitle}
                  >
                    ยังไม่มีข้อมูลการจัดส่ง
                  </Text>

                  <Text
                    style={styles.emptyText}
                  >
                    เมื่อคุณสั่งซื้อสินค้า
                    ข้อมูลการจัดส่งจะแสดงที่นี่
                  </Text>
                </View>
              ) : (
                orders.map((order) => {
                  const status = getStatus(
                    order.status
                  );

                  return (
                    <View
                      key={order.id}
                      style={styles.card}
                    >
                      {/* ORDER HEADER */}

                      <View
                        style={
                          styles.cardHeader
                        }
                      >
                        <View>
                          <Text
                            style={
                              styles.orderId
                            }
                          >
                            Order #{order.id}
                          </Text>

                          <Text
                            style={
                              styles.orderDate
                            }
                          >
                            {new Date(
                              order.created_at
                            ).toLocaleDateString(
                              'th-TH'
                            )}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.statusBadge
                          }
                        >
                          <Text
                            style={
                              styles.statusIcon
                            }
                          >
                            {status.icon}
                          </Text>

                          <Text
                            style={
                              styles.statusText
                            }
                          >
                            {status.label}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={styles.divider}
                      />

                      {/* TRACKING */}

                      <View
                        style={styles.infoRow}
                      >
                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          Tracking Number
                        </Text>

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {order.tracking_number ||
                            'ยังไม่มี'}
                        </Text>
                      </View>

                      {/* SHIPPING DATE */}

                      <View
                        style={styles.infoRow}
                      >
                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          วันที่จัดส่ง
                        </Text>

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {order.shipping_date ||
                            'ยังไม่ระบุ'}
                        </Text>
                      </View>

                      {/* ESTIMATED DELIVERY */}

                      <View
                        style={styles.infoRow}
                      >
                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          คาดว่าจะได้รับ
                        </Text>

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {order.estimated_delivery ||
                            'ยังไม่ระบุ'}
                        </Text>
                      </View>

                      {/* ADDRESS */}

                      <View
                        style={
                          styles.addressBox
                        }
                      >
                        <Text
                          style={
                            styles.addressTitle
                          }
                        >
                          📍 ที่อยู่จัดส่ง
                        </Text>

                        <Text
                          style={
                            styles.addressText
                          }
                        >
                          {order.shipping_address ||
                            'ไม่พบข้อมูลที่อยู่'}
                        </Text>
                      </View>

                      {/* TOTAL */}

                      <View
                        style={styles.totalRow}
                      >
                        <Text
                          style={
                            styles.totalLabel
                          }
                        >
                          ยอดรวม
                        </Text>

                        <Text
                          style={
                            styles.totalValue
                          }
                        >
                          ฿
                          {Number(
                            order.total_amount ||
                              0
                          ).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

/* ============================================================
   SPACE BACKGROUND
   ============================================================ */

function SpaceBackground() {
  return (
    <View
      pointerEvents="none"
      style={styles.background}
    >
      {/* MAIN GLOW */}

      <View style={styles.glowLarge} />

      <View style={styles.glowSmall} />

      {/* STARS */}

      <View
        style={[
          styles.star,
          {
            left: width * 0.08,
            top: height * 0.16,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.22,
            top: height * 0.28,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.38,
            top: height * 0.12,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.58,
            top: height * 0.20,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.82,
            top: height * 0.24,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.92,
            top: height * 0.48,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.18,
            top: height * 0.58,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.72,
            top: height * 0.62,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.48,
            top: height * 0.72,
          },
        ]}
      />

      {/* METEORS */}

      <Meteor
        x={width * 0.90}
        y={height * 0.08}
        delay={0}
      />

      <Meteor
        x={width * 0.72}
        y={height * 0.15}
        delay={1200}
      />

      <Meteor
        x={width * 0.45}
        y={height * 0.05}
        delay={2300}
      />

      <Meteor
        x={width * 0.95}
        y={height * 0.35}
        delay={3400}
      />

      <Meteor
        x={width * 0.65}
        y={height * 0.28}
        delay={4500}
      />
    </View>
  );
}

/* ============================================================
   METEOR
   ============================================================ */

function Meteor({
  x,
  y,
  delay,
}: {
  x: number;
  y: number;
  delay: number;
}) {
  const translateX =
    useRef(new Animated.Value(0)).current;

  const opacity =
    useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation =
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),

          Animated.parallel([
            Animated.timing(
              opacity,
              {
                toValue: 1,
                duration: 250,
                easing:
                  Easing.out(
                    Easing.ease
                  ),
                useNativeDriver: true,
              }
            ),

            Animated.timing(
              translateX,
              {
                toValue: -100,
                duration: 1100,
                easing:
                  Easing.out(
                    Easing.quad
                  ),
                useNativeDriver: true,
              }
            ),
          ]),

          Animated.timing(
            opacity,
            {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            translateX,
            {
              toValue: 0,
              duration: 1,
              useNativeDriver: true,
            }
          ),

          Animated.delay(2500),
        ])
      );

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.thinMeteor,
        {
          left: x,
          top: y,
          opacity,
          transform: [
            {
              translateX,
            },
            {
              rotate: '-25deg',
            },
          ],
        },
      ]}
    >
      <View
        style={
          styles.meteorLineLong
        }
      />

      <View
        style={
          styles.meteorLineMid
        }
      />

      <View
        style={
          styles.meteorLineBright
        }
      />

      <View
        style={styles.meteorPoint}
      />
    </Animated.View>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050507',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  /* ==========================================================
     BACKGROUND
     ========================================================== */

  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#050507',
    overflow: 'hidden',
  },

  glowLarge: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: width,
    left:
      width * 0.5 -
      width * 0.475,
    top: height * 0.22,
    backgroundColor:
      'rgba(38,30,100,0.20)',
    shadowColor: '#5F55FF',
    shadowOpacity: 0.35,
    shadowRadius: 70,
  },

  glowSmall: {
    position: 'absolute',
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width,
    left:
      width * 0.5 -
      width * 0.275,
    top: height * 0.34,
    backgroundColor:
      'rgba(55,40,150,0.10)',
  },

  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  thinMeteor: {
    position: 'absolute',
    width: 4,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  meteorLineLong: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 120,
    height: 1,
    borderRadius: 10,
    backgroundColor:
      'rgba(255,215,130,0.18)',
    shadowColor: '#FFD98A',
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },

  meteorLineMid: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 75,
    height: 1,
    borderRadius: 10,
    backgroundColor:
      'rgba(255,230,175,0.45)',
    shadowColor: '#FFE6B0',
    shadowOpacity: 0.55,
    shadowRadius: 5,
  },

  meteorLineBright: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 32,
    height: 1,
    borderRadius: 10,
    backgroundColor: '#FFF8E8',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  meteorPoint: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFF1C7',
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 4,
  },

  /* ==========================================================
     LOADING
     ========================================================== */

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#777B85',
    fontSize: 13,
  },

  /* ==========================================================
     HEADER
     ========================================================== */

  header: {
    backgroundColor:
      'rgba(5,5,7,0.82)',
    paddingHorizontal: 18,
    paddingVertical: 15,
    paddingTop:
      Platform.OS === 'web'
        ? 25
        : 15,
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.08)',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  headerSubtitle: {
    marginTop: 4,
    color: '#777B85',
    fontSize: 12,
  },

  adminButton: {
    backgroundColor:
      'rgba(100,85,255,0.12)',
    borderWidth: 1,
    borderColor:
      'rgba(120,105,255,0.35)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 95,
  },

  adminIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  adminButtonText: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '800',
    color: '#AFA7FF',
  },

  /* ==========================================================
     CONTENT
     ========================================================== */

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  /* ==========================================================
     CARD
     ========================================================== */

  card: {
    backgroundColor:
      'rgba(15,15,23,0.88)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor:
      'rgba(125,113,255,0.18)',

    shadowColor: '#675BFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  orderDate: {
    marginTop: 5,
    fontSize: 11,
    color: '#666A73',
  },

  /* ==========================================================
     STATUS
     ========================================================== */

  statusBadge: {
    backgroundColor:
      'rgba(100,85,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
    alignItems: 'center',
    maxWidth: 145,
    borderWidth: 1,
    borderColor:
      'rgba(120,105,255,0.20)',
  },

  statusIcon: {
    fontSize: 18,
  },

  statusText: {
    marginTop: 3,
    color: '#AFA7FF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },

  divider: {
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.08)',
    marginVertical: 14,
  },

  /* ==========================================================
     INFO
     ========================================================== */

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 11,
    gap: 10,
  },

  infoLabel: {
    color: '#777B85',
    fontSize: 12,
  },

  infoValue: {
    color: '#E8E8EC',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },

  /* ==========================================================
     ADDRESS
     ========================================================== */

  addressBox: {
    marginTop: 4,
    backgroundColor:
      'rgba(255,255,255,0.04)',
    borderRadius: 11,
    padding: 12,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  addressTitle: {
    color: '#D7D7DE',
    fontSize: 12,
    fontWeight: '700',
  },

  addressText: {
    marginTop: 6,
    color: '#777B85',
    fontSize: 12,
    lineHeight: 19,
  },

  /* ==========================================================
     TOTAL
     ========================================================== */

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.08)',
  },

  totalLabel: {
    color: '#777B85',
    fontSize: 13,
  },

  totalValue: {
    color: '#AFA7FF',
    fontSize: 17,
    fontWeight: '800',
  },

  /* ==========================================================
     EMPTY
     ========================================================== */

  emptyCard: {
    backgroundColor:
      'rgba(15,15,23,0.85)',
    borderRadius: 16,
    padding: 35,
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(125,113,255,0.18)',
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  emptyText: {
    marginTop: 8,
    color: '#777B85',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
  },
});