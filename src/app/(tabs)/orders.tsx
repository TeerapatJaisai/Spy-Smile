import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL =
  'http://119.59.102.161:3100/api';

const { width, height } =
  Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================

type Order = {
  id: number;
  total_amount: string;
  status: string;
  created_at: string;
};

type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_purchase: string;
};

type OrderDetail = Order & {
  shipping_address: string;
  items: OrderItem[];
};

// ============================================================
// STATUS
// ============================================================

const STATUS_MAP: Record<
  string,
  {
    label: string;
    bg: string;
    color: string;
  }
> = {
  preparing: {
    label: 'กำลังเตรียมสินค้า',
    bg: 'rgba(245,158,11,0.15)',
    color: '#FBBF24',
  },

  shipping: {
    label: 'กำลังจัดส่ง',
    bg: 'rgba(59,130,246,0.15)',
    color: '#60A5FA',
  },

  delivered: {
    label: 'จัดส่งสำเร็จ',
    bg: 'rgba(34,197,94,0.15)',
    color: '#4ADE80',
  },
};

// ============================================================
// MAIN
// ============================================================

export default function OrderHistoryScreen() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedOrder, setSelectedOrder] =
    useState<OrderDetail | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  // ==========================================================
  // FETCH ORDERS
  // ==========================================================

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const userId =
        Platform.OS === 'web'
          ? window.localStorage.getItem(
              'userId'
            )
          : null;

      if (!userId) {
        router.replace('/login');
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/orders/${userId}`
      );

      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(
        'FETCH ORDERS ERROR:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // REFRESH WHEN OPEN PAGE
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  // ==========================================================
  // OPEN ORDER DETAIL
  // ==========================================================

  const openOrderDetail = async (
    orderId: number
  ) => {
    setDetailLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/orders/detail/${orderId}`
      );

      if (res.ok) {
        const data =
          await res.json();

        setSelectedOrder(data);
      }
    } catch (err) {
      console.error(
        'ORDER DETAIL ERROR:',
        err
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // ==========================================================
  // RENDER ORDER
  // ==========================================================

  const renderOrder = ({
    item,
  }: {
    item: Order;
  }) => {
    const statusInfo =
      STATUS_MAP[item.status] ||
      STATUS_MAP.preparing;

    const dateText =
      new Date(
        item.created_at
      ).toLocaleDateString(
        'th-TH',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }
      );

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() =>
          openOrderDetail(item.id)
        }
        activeOpacity={0.8}
      >
        <View
          style={
            styles.orderCardHeader
          }
        >
          <View
            style={styles.orderInfo}
          >
            <Text
              style={styles.orderId}
            >
              Order #{item.id}
            </Text>

            <Text
              style={styles.orderDate}
            >
              {dateText}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusInfo.bg,
                borderColor:
                  statusInfo.color,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    statusInfo.color,
                },
              ]}
            >
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.orderCardFooter
          }
        >
          <Text
            style={styles.totalLabel}
          >
            ยอดรวม
          </Text>

          <Text
            style={styles.totalValue}
          >
            ฿
            {Number(
              item.total_amount
            ).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <View style={styles.container}>
      {/* HOME STYLE BACKGROUND */}
      <SpaceBackground />

      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#050507"
        />

        {/* ==================================================
            HEADER
        ================================================== */}

        <View
          style={styles.header}
        >
          <Text
            style={styles.headerTitle}
          >
            Order History
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            ประวัติการสั่งซื้อของคุณ
          </Text>
        </View>

        {/* ==================================================
            CONTENT
        ================================================== */}

        {loading ? (
          <View
            style={
              styles.centerContainer
            }
          >
            <ActivityIndicator
              size="large"
              color="#7C6CFF"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              กำลังโหลดข้อมูล...
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <View
            style={
              styles.centerContainer
            }
          >
            <Text
              style={styles.emptyIcon}
            >
              📦
            </Text>

            <Text
              style={styles.emptyText}
            >
              ยังไม่มีประวัติการสั่งซื้อ
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={() =>
                router.push(
                  '/product'
                )
              }
            >
              <Text
                style={
                  styles.shopButtonText
                }
              >
                เลือกซื้อสินค้า
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) =>
              String(item.id)
            }
            renderItem={renderOrder}
            contentContainerStyle={
              styles.listPadding
            }
            showsVerticalScrollIndicator={
              false
            }
          />
        )}

        {/* ==================================================
            ORDER DETAIL MODAL
        ================================================== */}

        {(selectedOrder ||
          detailLoading) && (
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={styles.modalCard}
            >
              {detailLoading ? (
                <View
                  style={
                    styles.loadingModal
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color="#7C6CFF"
                  />

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    กำลังโหลด...
                  </Text>
                </View>
              ) : (
                selectedOrder && (
                  <>
                    {/* MODAL HEADER */}

                    <View
                      style={
                        styles.modalHeader
                      }
                    >
                      <Text
                        style={
                          styles.modalTitle
                        }
                      >
                        Order #
                        {
                          selectedOrder.id
                        }
                      </Text>

                      <TouchableOpacity
                        onPress={() =>
                          setSelectedOrder(
                            null
                          )
                        }
                        style={
                          styles.closeButton
                        }
                      >
                        <Text
                          style={
                            styles.closeBtn
                          }
                        >
                          ✕
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* STATUS */}

                    <View
                      style={[
                        styles.modalStatus,
                        {
                          backgroundColor:
                            (
                              STATUS_MAP[
                                selectedOrder
                                  .status
                              ] ||
                              STATUS_MAP
                                .preparing
                            ).bg,
                          borderColor:
                            (
                              STATUS_MAP[
                                selectedOrder
                                  .status
                              ] ||
                              STATUS_MAP
                                .preparing
                            ).color,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalStatusText,
                          {
                            color:
                              (
                                STATUS_MAP[
                                  selectedOrder
                                    .status
                                ] ||
                                STATUS_MAP
                                  .preparing
                              ).color,
                          },
                        ]}
                      >
                        {
                          (
                            STATUS_MAP[
                              selectedOrder
                                .status
                            ] ||
                            STATUS_MAP
                              .preparing
                          ).label
                        }
                      </Text>
                    </View>

                    {/* DETAILS */}

                    <ScrollView
                      style={
                        styles.detailScroll
                      }
                      showsVerticalScrollIndicator={
                        false
                      }
                    >
                      {/* ADDRESS */}

                      <Text
                        style={
                          styles.sectionLabel
                        }
                      >
                        ที่อยู่จัดส่ง
                      </Text>

                      <View
                        style={
                          styles.addressBox
                        }
                      >
                        <Text
                          style={
                            styles.addressText
                          }
                        >
                          {
                            selectedOrder.shipping_address
                          }
                        </Text>
                      </View>

                      {/* ITEMS */}

                      <Text
                        style={[
                          styles.sectionLabel,
                          {
                            marginTop: 18,
                          },
                        ]}
                      >
                        รายการสินค้า
                      </Text>

                      {selectedOrder.items.map(
                        (it) => (
                          <View
                            key={it.id}
                            style={
                              styles.itemRow
                            }
                          >
                            <View
                              style={
                                styles.itemInfo
                              }
                            >
                              <Text
                                style={
                                  styles.itemName
                                }
                                numberOfLines={
                                  2
                                }
                              >
                                {
                                  it.product_name
                                }
                              </Text>

                              <Text
                                style={
                                  styles.itemQty
                                }
                              >
                                x
                                {
                                  it.quantity
                                }
                              </Text>
                            </View>

                            <Text
                              style={
                                styles.itemPrice
                              }
                            >
                              ฿
                              {(
                                Number(
                                  it.price_at_purchase
                                ) *
                                it.quantity
                              ).toLocaleString()}
                            </Text>
                          </View>
                        )
                      )}
                    </ScrollView>

                    {/* TOTAL */}

                    <View
                      style={
                        styles.modalTotalRow
                      }
                    >
                      <Text
                        style={
                          styles.modalTotalLabel
                        }
                      >
                        ยอดรวมทั้งหมด
                      </Text>

                      <Text
                        style={
                          styles.modalTotalValue
                        }
                      >
                        ฿
                        {Number(
                          selectedOrder.total_amount
                        ).toLocaleString()}
                      </Text>
                    </View>
                  </>
                )
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ============================================================
// SPACE BACKGROUND
// ============================================================

function SpaceBackground() {
  return (
    <View
      pointerEvents="none"
      style={styles.background}
    >
      {/* LARGE PURPLE GLOW */}

      <View
        style={styles.bigGlow}
      />

      <View
        style={styles.bigGlow2}
      />

      {/* STARS */}

      <View
        style={[
          styles.star,
          {
            left: width * 0.08,
            top: height * 0.15,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.25,
            top: height * 0.08,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.46,
            top: height * 0.17,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.76,
            top: height * 0.12,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.90,
            top: height * 0.24,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.18,
            top: height * 0.48,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.82,
            top: height * 0.55,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.45,
            top: height * 0.70,
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: width * 0.72,
            top: height * 0.80,
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
        delay={3500}
      />

      <Meteor
        x={width * 0.45}
        y={height * 0.05}
        delay={7000}
      />

      <Meteor
        x={width * 0.95}
        y={height * 0.35}
        delay={5000}
      />

      <Meteor
        x={width * 0.65}
        y={height * 0.28}
        delay={9000}
      />
    </View>
  );
}

// ============================================================
// METEOR
// ============================================================

function Meteor({
  x,
  y,
  delay,
}: {
  x: number;
  y: number;
  delay: number;
}) {
  const animation =
    useState(
      () => new Animated.Value(0)
    )[0];

  useState(() => {
    const timer = setTimeout(() => {
      const loop =
        Animated.loop(
          Animated.sequence([
            Animated.timing(
              animation,
              {
                toValue: 1,
                duration: 1800,
                easing:
                  Easing.linear,
                useNativeDriver: true,
              }
            ),

            Animated.timing(
              animation,
              {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }
            ),
          ])
        );

      loop.start();
    }, delay);

    return () =>
      clearTimeout(timer);
  });

  const translateX =
    animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -140],
    });

  const opacity =
    animation.interpolate({
      inputRange: [
        0,
        0.15,
        0.7,
        1,
      ],
      outputRange: [
        0,
        1,
        0.5,
        0,
      ],
    });

  return (
    <Animated.View
      style={[
        styles.meteor,
        {
          left: x,
          top: y,
          opacity,
          transform: [
            {
              translateX,
            },
          ],
        },
      ]}
    >
      <View
        style={styles.meteorLineLong}
      />

      <View
        style={styles.meteorLineMid}
      />

      <View
        style={styles.meteorLineBright}
      />

      <View
        style={styles.meteorPoint}
      />
    </Animated.View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // MAIN
  // ==========================================================

  container: {
    flex: 1,
    backgroundColor: '#050507',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#050507',
    overflow: 'hidden',
  },

  bigGlow: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor:
      'rgba(55,35,160,0.10)',
    left:
      width * 0.5 -
      width * 0.45,
    top:
      height * 0.30 -
      width * 0.45,
  },

  bigGlow2: {
    position: 'absolute',
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    backgroundColor:
      'rgba(30,50,180,0.06)',
    left:
      width * 0.5 -
      width * 0.325,
    top:
      height * 0.52 -
      width * 0.325,
  },

  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor:
      'rgba(255,255,255,0.65)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },

  meteor: {
    position: 'absolute',
    width: 4,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor:
      '#FFF8E8',
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

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === 'web'
        ? 30
        : 18,
    paddingBottom: 16,

    backgroundColor:
      'rgba(5,5,7,0.72)',

    borderBottomWidth: 1,

    borderBottomColor:
      'rgba(255,255,255,0.08)',
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#777B85',
    marginTop: 3,
  },

  // ==========================================================
  // CENTER
  // ==========================================================

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  loadingText: {
    color: '#777B85',
    fontSize: 13,
    marginTop: 12,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 14,
    color: '#777B85',
    marginBottom: 20,
  },

  shopButton: {
    backgroundColor:
      '#675BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#675BFF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },

  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ==========================================================
  // LIST
  // ==========================================================

  listPadding: {
    padding: 16,
    paddingBottom: 100,
  },

  // ==========================================================
  // ORDER CARD
  // ==========================================================

  orderCard: {
    backgroundColor:
      'rgba(15,15,23,0.88)',

    borderWidth: 1,

    borderColor:
      'rgba(125,113,255,0.20)',

    borderRadius: 15,

    padding: 15,

    marginBottom: 12,

    shadowColor: '#675BFF',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.10,

    shadowRadius: 12,

    elevation: 3,
  },

  orderCardHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  orderInfo: {
    flex: 1,
  },

  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  orderDate: {
    fontSize: 11,
    color: '#777B85',
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginLeft: 10,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  orderCardFooter: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',

    borderTopWidth: 1,

    borderTopColor:
      'rgba(255,255,255,0.07)',

    paddingTop: 11,
  },

  totalLabel: {
    fontSize: 12,
    color: '#777B85',
    fontWeight: '600',
  },

  totalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#AFA7FF',
  },

  // ==========================================================
  // MODAL
  // ==========================================================

  modalOverlay: {
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor:
      'rgba(0,0,0,0.78)',

    justifyContent: 'center',

    alignItems: 'center',

    padding: 18,

    zIndex: 999,
  },

  modalCard: {
    backgroundColor:
      '#111118',

    borderRadius: 20,

    padding: 20,

    width: '100%',

    maxWidth: 420,

    maxHeight: '85%',

    borderWidth: 1,

    borderColor:
      'rgba(125,113,255,0.25)',

    shadowColor: '#675BFF',

    shadowOpacity: 0.20,

    shadowRadius: 25,

    elevation: 10,
  },

  loadingModal: {
    paddingVertical: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalHeader: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.06)',
  },

  closeBtn: {
    fontSize: 16,
    color: '#999CA6',
  },

  modalStatus: {
    alignSelf: 'flex-start',

    borderRadius: 20,

    paddingHorizontal: 12,
    paddingVertical: 6,

    marginBottom: 15,

    borderWidth: 1,
  },

  modalStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  detailScroll: {
    maxHeight: 360,
  },

  // ==========================================================
  // ADDRESS
  // ==========================================================

  sectionLabel: {
    fontSize: 11,

    fontWeight: '800',

    color: '#777B85',

    marginBottom: 7,
  },

  addressBox: {
    backgroundColor:
      'rgba(255,255,255,0.04)',

    borderRadius: 10,

    padding: 12,

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.07)',
  },

  addressText: {
    fontSize: 13,

    color: '#B8BAC2',

    lineHeight: 20,
  },

  // ==========================================================
  // ITEMS
  // ==========================================================

  itemRow: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'flex-start',

    paddingVertical: 11,

    borderTopWidth: 1,

    borderTopColor:
      'rgba(255,255,255,0.07)',
  },

  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },

  itemName: {
    fontSize: 13,
    color: '#E7E7EA',
    lineHeight: 19,
  },

  itemQty: {
    fontSize: 12,
    color: '#777B85',
    marginTop: 3,
  },

  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#AFA7FF',
  },

  // ==========================================================
  // TOTAL
  // ==========================================================

  modalTotalRow: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    marginTop: 15,

    paddingTop: 14,

    borderTopWidth: 1,

    borderTopColor:
      'rgba(255,255,255,0.10)',
  },

  modalTotalLabel: {
    fontSize: 13,

    color: '#777B85',

    fontWeight: '600',
  },

  modalTotalValue: {
    fontSize: 20,

    fontWeight: '900',

    color: '#FFFFFF',
  },
});