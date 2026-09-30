import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import QRCode from 'react-native-qrcode-svg';
import generatePayload from 'promptpay-qr';

const API_BASE_URL =
  'http://119.59.102.161:3100/api';

/*
  ============================================================
  PAYMENT SETTINGS
  ============================================================

  เปลี่ยน PROMPTPAY_ID เป็นเบอร์โทรศัพท์
  หรือเลข PromptPay ของบัญชีร้านจริง

  ตัวอย่าง:
  0812345678

  ชื่อบัญชีที่จะแสดง:
  kun
*/

const PROMPTPAY_ID = '0625613653';
const PAYMENT_ACCOUNT_NAME = 'Spy&Smile Shop';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

type Address = {
  id: number;
  address_text: string;
  is_default?: boolean;
};

function SpaceBackground() {
  const stars = useMemo(
    () => [
      { left: 25, top: 75, size: 2 },
      { left: SCREEN_WIDTH * 0.18, top: SCREEN_HEIGHT * 0.15, size: 2 },
      { left: SCREEN_WIDTH * 0.32, top: SCREEN_HEIGHT * 0.08, size: 1 },
      { left: SCREEN_WIDTH * 0.48, top: SCREEN_HEIGHT * 0.18, size: 2 },
      { left: SCREEN_WIDTH * 0.63, top: SCREEN_HEIGHT * 0.10, size: 1 },
      { left: SCREEN_WIDTH * 0.78, top: SCREEN_HEIGHT * 0.18, size: 2 },
      { left: SCREEN_WIDTH * 0.92, top: SCREEN_HEIGHT * 0.08, size: 1 },
      { left: SCREEN_WIDTH * 0.12, top: SCREEN_HEIGHT * 0.35, size: 1 },
      { left: SCREEN_WIDTH * 0.27, top: SCREEN_HEIGHT * 0.42, size: 2 },
      { left: SCREEN_WIDTH * 0.42, top: SCREEN_HEIGHT * 0.34, size: 1 },
      { left: SCREEN_WIDTH * 0.58, top: SCREEN_HEIGHT * 0.44, size: 2 },
      { left: SCREEN_WIDTH * 0.74, top: SCREEN_HEIGHT * 0.38, size: 1 },
      { left: SCREEN_WIDTH * 0.88, top: SCREEN_HEIGHT * 0.46, size: 2 },
      { left: SCREEN_WIDTH * 0.06, top: SCREEN_HEIGHT * 0.62, size: 2 },
      { left: SCREEN_WIDTH * 0.22, top: SCREEN_HEIGHT * 0.72, size: 1 },
      { left: SCREEN_WIDTH * 0.38, top: SCREEN_HEIGHT * 0.64, size: 2 },
      { left: SCREEN_WIDTH * 0.56, top: SCREEN_HEIGHT * 0.75, size: 1 },
      { left: SCREEN_WIDTH * 0.72, top: SCREEN_HEIGHT * 0.67, size: 2 },
      { left: SCREEN_WIDTH * 0.91, top: SCREEN_HEIGHT * 0.74, size: 1 },
      { left: SCREEN_WIDTH * 0.15, top: SCREEN_HEIGHT * 0.90, size: 1 },
      { left: SCREEN_WIDTH * 0.46, top: SCREEN_HEIGHT * 0.88, size: 2 },
      { left: SCREEN_WIDTH * 0.82, top: SCREEN_HEIGHT * 0.91, size: 1 },
    ],
    []
  );

  const meteors = useMemo(
    () => [
      {
        x: SCREEN_WIDTH * 0.90,
        y: SCREEN_HEIGHT * 0.08,
        width: 105,
      },
      {
        x: SCREEN_WIDTH * 0.72,
        y: SCREEN_HEIGHT * 0.15,
        width: 70,
      },
      {
        x: SCREEN_WIDTH * 0.45,
        y: SCREEN_HEIGHT * 0.05,
        width: 85,
      },
      {
        x: SCREEN_WIDTH * 0.95,
        y: SCREEN_HEIGHT * 0.35,
        width: 75,
      },
      {
        x: SCREEN_WIDTH * 0.65,
        y: SCREEN_HEIGHT * 0.28,
        width: 55,
      },
    ],
    []
  );

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <View style={styles.spaceBase} />

      <View
        style={[
          styles.spaceGlow,
          styles.spaceGlowBlue,
        ]}
      />

      <View
        style={[
          styles.spaceGlow,
          styles.spaceGlowPurple,
        ]}
      />

      {stars.map((star, index) => (
        <View
          key={`star-${index}`}
          style={[
            styles.star,
            {
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              borderRadius: star.size,
            },
          ]}
        />
      ))}

      {meteors.map((meteor, index) => (
        <View
          key={`meteor-${index}`}
          style={[
            styles.meteor,
            {
              left: meteor.x,
              top: meteor.y,
            },
          ]}
        >
          <View
            style={[
              styles.meteorLine,
              {
                width: meteor.width,
              },
            ]}
          />

          <View style={styles.meteorPoint} />
        </View>
      ))}
    </View>
  );
}

export default function CartScreen() {
  const [cartItems, setCartItems] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [checkoutVisible, setCheckoutVisible] =
    useState(false);

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [selectedAddress, setSelectedAddress] =
    useState<string | null>(null);

  const [isAddingAddress, setIsAddingAddress] =
    useState(false);

  const [newAddressText, setNewAddressText] =
    useState('');

  const [processingOrder, setProcessingOrder] =
    useState(false);

  /*
    ==========================================================
    PAYMENT QR
    ==========================================================
  */

  const [paymentVisible, setPaymentVisible] =
    useState(false);

  const [paymentAmount, setPaymentAmount] =
    useState(0);

  const [paymentOrderId, setPaymentOrderId] =
    useState<number | string | null>(null);

  /*
    ==========================================================
    CUSTOM ALERT
    ==========================================================
  */

  const [alertInfo, setAlertInfo] =
    useState<{
      visible: boolean;
      title: string;
      message: string;
    }>({
      visible: false,
      title: '',
      message: '',
    });

  const showAlert = (
    title: string,
    message: string
  ) => {
    setAlertInfo({
      visible: true,
      title,
      message,
    });
  };

  /*
    ==========================================================
    FETCH CART
    ==========================================================
  */

  const fetchCart = async () => {
    try {
      setLoading(true);

      const id =
        Platform.OS === 'web'
          ? window.localStorage.getItem(
              'userId'
            )
          : null;

      setUserId(id);

      if (!id) {
        setCartItems([]);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/cart/${id}`
      );

      if (response.ok) {
        const data =
          await response.json();

        setCartItems(
          Array.isArray(data)
            ? data
            : []
        );
      }
    } catch (err) {
      console.log(
        'FETCH CART ERROR:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  /*
    ==========================================================
    UPDATE QUANTITY
    ==========================================================
  */

  const updateQuantity = async (
    cartId: number,
    currentQty: number,
    delta: number
  ) => {
    const newQty = Math.max(
      1,
      Number(currentQty) + delta
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/cart/${cartId}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            quantity: newQty,
          }),
        }
      );

      if (!response.ok) {
        showAlert(
          'ไม่สามารถแก้ไขจำนวนได้',
          'กรุณาลองใหม่อีกครั้ง'
        );

        return;
      }

      fetchCart();
    } catch (err) {
      console.log(
        'UPDATE CART ERROR:',
        err
      );
    }
  };

  /*
    ==========================================================
    REMOVE ITEM
    ==========================================================
  */

  const removeItem = async (
    cartId: number
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/cart/${cartId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        showAlert(
          'ลบสินค้าไม่สำเร็จ',
          'กรุณาลองใหม่อีกครั้ง'
        );

        return;
      }

      fetchCart();
    } catch (err) {
      console.log(
        'REMOVE CART ERROR:',
        err
      );
    }
  };

  /*
    ==========================================================
    CALCULATE TOTAL
    ==========================================================
  */

  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => {
        const price =
          Number(
            item.selling_price || 0
          );

        const quantity =
          Number(
            item.quantity || 0
          );

        return (
          sum +
          price * quantity
        );
      },
      0
    );
  };

  /*
    ==========================================================
    OPEN CHECKOUT
    ==========================================================
  */

  const handleOpenCheckout =
    async () => {
      if (
        !userId ||
        cartItems.length === 0
      ) {
        return;
      }

      setCheckoutVisible(true);
      setIsAddingAddress(false);

      try {
        const res =
          await fetch(
            `${API_BASE_URL}/addresses/${userId}`
          );

        if (res.ok) {
          const data =
            await res.json();

          const addressData =
            Array.isArray(data)
              ? data
              : [];

          setAddresses(
            addressData
          );

          if (
            addressData.length > 0
          ) {
            const defaultAddr =
              addressData.find(
                (a: Address) =>
                  Boolean(
                    a.is_default
                  )
              );

            setSelectedAddress(
              defaultAddr
                ? defaultAddr.address_text
                : addressData[0]
                    .address_text
            );
          } else {
            setSelectedAddress(null);
          }
        }
      } catch (err) {
        console.log(
          'FETCH ADDRESS ERROR:',
          err
        );
      }
    };

  /*
    ==========================================================
    SAVE NEW ADDRESS
    ==========================================================
  */

  const handleSaveNewAddress =
    async () => {
      if (
        !newAddressText.trim()
      ) {
        showAlert(
          'แจ้งเตือน',
          'กรุณากรอกที่อยู่'
        );

        return;
      }

      if (!userId) {
        showAlert(
          'แจ้งเตือน',
          'ไม่พบข้อมูลผู้ใช้'
        );

        return;
      }

      try {
        const res =
          await fetch(
            `${API_BASE_URL}/addresses`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                user_id: Number(
                  userId
                ),

                address_text:
                  newAddressText.trim(),

                is_default:
                  addresses.length ===
                  0,
              }),
            }
          );

        if (res.ok) {
          const savedAddress =
            newAddressText.trim();

          setSelectedAddress(
            savedAddress
          );

          setNewAddressText('');

          setIsAddingAddress(
            false
          );

          const refreshRes =
            await fetch(
              `${API_BASE_URL}/addresses/${userId}`
            );

          if (refreshRes.ok) {
            const data =
              await refreshRes.json();

            setAddresses(
              Array.isArray(data)
                ? data
                : []
            );
          }
        } else {
          const errorData =
            await res
              .json()
              .catch(
                () => null
              );

          showAlert(
            'เพิ่มที่อยู่ไม่สำเร็จ',
            errorData?.error ||
              'ไม่สามารถเพิ่มที่อยู่ได้'
          );
        }
      } catch (err) {
        console.log(
          'SAVE ADDRESS ERROR:',
          err
        );

        showAlert(
          'เกิดข้อผิดพลาด',
          'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
        );
      }
    };

  /*
    ==========================================================
    CONFIRM ORDER
    ==========================================================
  */

  const handleConfirmOrder =
    async () => {
      if (!selectedAddress) {
        showAlert(
          'แจ้งเตือน',
          'กรุณาเลือกที่อยู่จัดส่ง'
        );

        return;
      }

      if (!userId) {
        showAlert(
          'แจ้งเตือน',
          'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่'
        );

        return;
      }

      const total =
        calculateTotal();

      if (total <= 0) {
        showAlert(
          'แจ้งเตือน',
          'ยอดสั่งซื้อไม่ถูกต้อง'
        );

        return;
      }

      setProcessingOrder(true);

      try {
        const res =
          await fetch(
            `${API_BASE_URL}/checkout`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                user_id:
                  Number(userId),

                address_text:
                  selectedAddress,

                total_price:
                  total,
              }),
            }
          );

        const result =
          await res
            .json()
            .catch(
              () => ({})
            );

        if (res.ok) {
          /*
            ปิดหน้าต่างเลือกที่อยู่
          */

          setCheckoutVisible(
            false
          );

          setIsAddingAddress(
            false
          );

          /*
            เก็บยอดเงินสำหรับ QR
          */

          setPaymentAmount(
            total
          );

          /*
            รองรับหลายชื่อ field
            ที่ backend อาจส่งกลับมา
          */

          const orderId =
            result?.orderId ??
            result?.order_id ??
            result?.id ??
            null;

          setPaymentOrderId(
            orderId
          );

          /*
            เปิด QR
          */

          setPaymentVisible(
            true
          );

          /*
            โหลดตะกร้าใหม่
          */

          fetchCart();
        } else {
          showAlert(
            'สั่งซื้อไม่สำเร็จ',
            result?.error ||
              result?.message ||
              'ไม่สามารถดำเนินการสั่งซื้อได้'
          );
        }
      } catch (err) {
        console.log(
          'CHECKOUT ERROR:',
          err
        );

        showAlert(
          'เกิดข้อผิดพลาด',
          'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
        );
      } finally {
        setProcessingOrder(
          false
        );
      }
    };

  /*
    ==========================================================
    IMAGE
    ==========================================================
  */

  const resolveImage = (
    item: any
  ) => {
    const url =
      item.image_url ||
      item.image;

    if (
      url &&
      typeof url === 'string' &&
      url.trim() !== ''
    ) {
      const value =
        url.trim();

      if (
        value.startsWith(
          'http://'
        ) ||
        value.startsWith(
          'https://'
        ) ||
        value.startsWith(
          'data:image/'
        )
      ) {
        return value;
      }

      if (
        value.startsWith('/')
      ) {
        return `${API_BASE_URL}${value}`;
      }

      return `${API_BASE_URL}/${value}`;
    }

    return 'https://placehold.co/150x150/17152F/9CA3AF.png?text=No+Image';
  };

  /*
    ==========================================================
    CART ITEM
    ==========================================================
  */

  const renderItem = ({
    item,
  }: {
    item: any;
  }) => (
    <View
      style={styles.cartCard}
    >
      <Image
        source={{
          uri: resolveImage(
            item
          ),
        }}
        style={
          styles.productImage
        }
        resizeMode="cover"
      />

      <View
        style={
          styles.productInfo
        }
      >
        <Text
          style={
            styles.productName
          }
          numberOfLines={2}
        >
          {item.name}
        </Text>

        <Text
          style={
            styles.brandText
          }
          numberOfLines={1}
        >
          {item.brand ||
            'N/A'}
        </Text>

        <Text
          style={
            styles.priceText
          }
        >
          ฿
          {Number(
            item.selling_price ||
              0
          ).toLocaleString(
            'th-TH'
          )}
        </Text>
      </View>

      <View
        style={
          styles.actionColumn
        }
      >
        <TouchableOpacity
          style={
            styles.deleteBtn
          }
          onPress={() =>
            removeItem(
              Number(
                item.cart_id
              )
            )
          }
        >
          <Text
            style={
              styles.deleteText
            }
          >
            ✕
          </Text>
        </TouchableOpacity>

        <View
          style={
            styles.qtyContainer
          }
        >
          <TouchableOpacity
            style={
              styles.qtyBtn
            }
            onPress={() =>
              updateQuantity(
                Number(
                  item.cart_id
                ),
                Number(
                  item.quantity
                ),
                -1
              )
            }
          >
            <Text
              style={
                styles.qtyBtnText
              }
            >
              −
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.qtyText
            }
          >
            {item.quantity}
          </Text>

          <TouchableOpacity
            style={
              styles.qtyBtn
            }
            onPress={() =>
              updateQuantity(
                Number(
                  item.cart_id
                ),
                Number(
                  item.quantity
                ),
                1
              )
            }
          >
            <Text
              style={
                styles.qtyBtnText
              }
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /*
    ==========================================================
    PAYMENT QR VALUE
    ==========================================================
  */

  const paymentQRValue =
    useMemo(() => {
      if (
        !PROMPTPAY_ID ||
        paymentAmount <= 0
      ) {
        return '';
      }

      try {
        return generatePayload(
          PROMPTPAY_ID,
          {
            amount:
              Number(
                paymentAmount
              ),
          }
        );
      } catch (error) {
        console.log(
          'PROMPTPAY QR ERROR:',
          error
        );

        return '';
      }
    }, [paymentAmount]);

  /*
    ==========================================================
    MONEY FORMAT
    ==========================================================
  */

  const paymentMoney =
    Number(
      paymentAmount || 0
    ).toLocaleString(
      'th-TH',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  /*
    ==========================================================
    RETURN
    ==========================================================
  */

  return (
    <View
      style={
        styles.container
      }
    >
      <SpaceBackground />

      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#050507"
        />

        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            ตะกร้าสินค้า
          </Text>

          <View
            style={
              styles.badgeCount
            }
          >
            <Text
              style={
                styles.itemCount
              }
            >
              {cartItems.length}{' '}
              ชิ้น
            </Text>
          </View>
        </View>

        {/* CONTENT */}

        {loading ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <ActivityIndicator
              size="large"
              color="#7C6CFF"
            />
          </View>
        ) : cartItems.length ===
          0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              🛒
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              ไม่มีสินค้าในตะกร้า
            </Text>

            <TouchableOpacity
              style={
                styles.shopBtn
              }
              onPress={() =>
                router.push(
                  '/product'
                )
              }
            >
              <Text
                style={
                  styles.shopBtnText
                }
              >
                เลือกซื้อสินค้า
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={
                cartItems
              }
              keyExtractor={(
                item
              ) =>
                String(
                  item.cart_id
                )
              }
              renderItem={
                renderItem
              }
              contentContainerStyle={
                styles.listPadding
              }
              showsVerticalScrollIndicator={
                false
              }
            />

            {/* CHECKOUT */}

            <View
              style={
                styles.checkoutSection
              }
            >
              <View
                style={
                  styles.totalRow
                }
              >
                <Text
                  style={
                    styles.totalLabel
                  }
                >
                  ยอดรวมทั้งหมด
                </Text>

                <Text
                  style={
                    styles.totalValue
                  }
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  ฿
                  {calculateTotal().toLocaleString(
                    'th-TH'
                  )}
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.checkoutBtn
                }
                onPress={
                  handleOpenCheckout
                }
              >
                <Text
                  style={
                    styles.checkoutBtnText
                  }
                >
                  ชำระเงิน
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ==================================================
            CHECKOUT MODAL
            ================================================== */}

        {checkoutVisible && (
          <View
            style={
              styles.modalOverlay
            }
          >
            <KeyboardAvoidingView
              behavior={
                Platform.OS === 'ios'
                  ? 'padding'
                  : 'height'
              }
              style={
                styles.modalContainer
              }
            >
              <View
                style={
                  styles.modalCard
                }
              >
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  ยืนยันการสั่งซื้อ
                </Text>

                {!isAddingAddress ? (
                  <>
                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      เลือกที่อยู่จัดส่ง
                    </Text>

                    <ScrollView
                      style={
                        styles.addressList
                      }
                      showsVerticalScrollIndicator={
                        false
                      }
                    >
                      {addresses.length ===
                      0 ? (
                        <Text
                          style={
                            styles.noAddressText
                          }
                        >
                          ยังไม่มีที่อยู่จัดส่ง
                        </Text>
                      ) : (
                        addresses.map(
                          (
                            addr
                          ) => {
                            const isSelected =
                              selectedAddress ===
                              addr.address_text;

                            return (
                              <TouchableOpacity
                                key={
                                  addr.id
                                }
                                style={[
                                  styles.addressItem,
                                  isSelected &&
                                    styles.addressItemSelected,
                                ]}
                                onPress={() =>
                                  setSelectedAddress(
                                    addr.address_text
                                  )
                                }
                              >
                                <View
                                  style={
                                    styles.radioCircle
                                  }
                                >
                                  {isSelected && (
                                    <View
                                      style={
                                        styles.radioInner
                                      }
                                    />
                                  )}
                                </View>

                                <Text
                                  style={[
                                    styles.addressItemText,
                                    isSelected &&
                                      styles.addressItemTextSelected,
                                  ]}
                                >
                                  {
                                    addr.address_text
                                  }
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )
                      )}
                    </ScrollView>

                    <TouchableOpacity
                      style={
                        styles.addAddressInlineBtn
                      }
                      onPress={() =>
                        setIsAddingAddress(
                          true
                        )
                      }
                    >
                      <Text
                        style={
                          styles.addAddressInlineText
                        }
                      >
                        + เพิ่มที่อยู่ใหม่
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View
                    style={
                      styles.addAddressView
                    }
                  >
                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      เพิ่มที่อยู่ใหม่
                    </Text>

                    <TextInput
                      style={
                        styles.inputArea
                      }
                      multiline
                      placeholder="กรอกที่อยู่จัดส่งแบบเต็ม..."
                      placeholderTextColor="#777B85"
                      value={
                        newAddressText
                      }
                      onChangeText={
                        setNewAddressText
                      }
                    />

                    <View
                      style={
                        styles.addAddressActions
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.cancelAddBtn
                        }
                        onPress={() => {
                          setIsAddingAddress(
                            false
                          );

                          setNewAddressText(
                            ''
                          );
                        }}
                      >
                        <Text
                          style={
                            styles.cancelAddText
                          }
                        >
                          ยกเลิก
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.saveAddBtn
                        }
                        onPress={
                          handleSaveNewAddress
                        }
                      >
                        <Text
                          style={
                            styles.saveAddText
                          }
                        >
                          บันทึกที่อยู่
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* SUMMARY */}

                <View
                  style={
                    styles.modalSummary
                  }
                >
                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    ยอดที่ต้องชำระ:
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    ฿
                    {calculateTotal().toLocaleString(
                      'th-TH'
                    )}
                  </Text>
                </View>

                {/* BUTTONS */}

                <View
                  style={
                    styles.modalActions
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.modalCancelBtn
                    }
                    onPress={() =>
                      setCheckoutVisible(
                        false
                      )
                    }
                    disabled={
                      processingOrder
                    }
                  >
                    <Text
                      style={
                        styles.modalCancelText
                      }
                    >
                      ปิด
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalConfirmBtn,
                      (!selectedAddress ||
                        isAddingAddress ||
                        processingOrder) && {
                        opacity: 0.5,
                      },
                    ]}
                    onPress={
                      handleConfirmOrder
                    }
                    disabled={
                      !selectedAddress ||
                      isAddingAddress ||
                      processingOrder
                    }
                  >
                    <Text
                      style={
                        styles.modalConfirmText
                      }
                    >
                      {processingOrder
                        ? 'กำลังดำเนินการ...'
                        : 'ยืนยันสั่งซื้อ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}

        {/* ==================================================
            PAYMENT QR MODAL
            ================================================== */}

        {paymentVisible && (
          <View
            style={
              styles.paymentOverlay
            }
          >
            <View
              style={
                styles.paymentCard
              }
            >
              <Text
                style={
                  styles.paymentTitle
                }
              >
                ชำระเงิน
              </Text>

              <Text
                style={
                  styles.paymentSubtitle
                }
              >
                สแกน QR Code เพื่อชำระเงิน
              </Text>

              <View
                style={
                  styles.qrBox
                }
              >
                {paymentQRValue ? (
                  <QRCode
                    value={
                      paymentQRValue
                    }
                    size={220}
                    backgroundColor="#FFFFFF"
                    color="#000000"
                  />
                ) : (
                  <Text
                    style={
                      styles.qrError
                    }
                  >
                    ไม่สามารถสร้าง QR Code ได้
                  </Text>
                )}
              </View>

              <View
                style={
                  styles.paymentInfo
                }
              >
                <View
                  style={
                    styles.paymentRow
                  }
                >
                  <Text
                    style={
                      styles.paymentLabel
                    }
                  >
                    ชื่อบัญชี
                  </Text>

                  <Text
                    style={
                      styles.paymentAccount
                    }
                  >
                    {PAYMENT_ACCOUNT_NAME}
                  </Text>
                </View>

                <View
                  style={
                    styles.paymentRow
                  }
                >
                  <Text
                    style={
                      styles.paymentLabel
                    }
                  >
                    ยอดที่ต้องชำระ
                  </Text>

                  <Text
                    style={
                      styles.paymentAmount
                    }
                  >
                    ฿{paymentMoney}
                  </Text>
                </View>

                {paymentOrderId !==
                  null && (
                  <View
                    style={
                      styles.paymentRow
                    }
                  >
                    <Text
                      style={
                        styles.paymentLabel
                      }
                    >
                      Order ID
                    </Text>

                    <Text
                      style={
                        styles.paymentAccount
                      }
                    >
                      #
                      {
                        paymentOrderId
                      }
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={
                  styles.paymentNote
                }
              >
                กรุณาตรวจสอบชื่อบัญชีและยอดเงิน
                ก่อนชำระเงิน
              </Text>

              <TouchableOpacity
                style={
                  styles.paidButton
                }
                onPress={() => {
                  setPaymentVisible(
                    false
                  );

                  router.replace(
                    '/orders'
                  );
                }}
              >
                <Text
                  style={
                    styles.paidButtonText
                  }
                >
                  ฉันชำระเงินแล้ว
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.paymentCloseButton
                }
                onPress={() =>
                  setPaymentVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.paymentCloseText
                  }
                >
                  ปิด
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ==================================================
            CUSTOM ALERT
            ================================================== */}

        {alertInfo.visible && (
          <View
            style={
              styles.customModalOverlay
            }
          >
            <View
              style={
                styles.customModalCard
              }
            >
              <Text
                style={
                  styles.customModalTitle
                }
              >
                {alertInfo.title}
              </Text>

              <Text
                style={
                  styles.customModalMessage
                }
              >
                {alertInfo.message}
              </Text>

              <TouchableOpacity
                style={
                  styles.customModalBtn
                }
                onPress={() =>
                  setAlertInfo({
                    ...alertInfo,
                    visible:
                      false,
                  })
                }
              >
                <Text
                  style={
                    styles.customModalBtnText
                  }
                >
                  ตกลง
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

/*
============================================================
STYLES
============================================================
*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050507',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  /*
    SPACE BACKGROUND
  */

  spaceBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050507',
  },

  spaceGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },

  spaceGlowBlue: {
    left: -110,
    top: SCREEN_HEIGHT * 0.25,
    backgroundColor:
      'rgba(45,70,180,0.08)',
  },

  spaceGlowPurple: {
    right: -120,
    top: SCREEN_HEIGHT * 0.55,
    backgroundColor:
      'rgba(100,60,200,0.08)',
  },

  star: {
    position: 'absolute',
    backgroundColor:
      'rgba(255,255,255,0.65)',
  },

  meteor: {
    position: 'absolute',
    width: 4,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  meteorLine: {
    position: 'absolute',
    right: 1,
    top: 2,
    height: 1,
    borderRadius: 10,
    backgroundColor:
      'rgba(255,220,150,0.32)',
  },

  meteorPoint: {
    position: 'absolute',
    right: 0,
    top: 1,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  /*
    HEADER
  */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === 'web'
        ? 22
        : 10,
    paddingBottom: 16,

    backgroundColor:
      'rgba(5,5,7,0.72)',

    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.08)',
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  badgeCount: {
    backgroundColor:
      'rgba(100,85,255,0.18)',

    paddingHorizontal: 12,
    paddingVertical: 6,

    borderRadius: 20,

    borderWidth: 1,
    borderColor:
      'rgba(120,105,255,0.35)',
  },

  itemCount: {
    fontSize: 12,
    color: '#AFA7FF',
    fontWeight: '700',
  },

  /*
    LIST
  */

  listPadding: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },

  /*
    CART CARD
  */

  cartCard: {
    flexDirection: 'row',

    backgroundColor:
      'rgba(15,15,23,0.90)',

    padding: 12,

    borderRadius: 16,

    borderWidth: 1,
    borderColor:
      'rgba(125,113,255,0.20)',

    shadowColor: '#675BFF',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  productImage: {
    width: 72,
    height: 72,

    borderRadius: 12,

    backgroundColor:
      '#101018',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    minWidth: 0,
  },

  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },

  brandText: {
    fontSize: 12,
    color: '#777B85',
    marginBottom: 6,
  },

  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9B8CFF',
  },

  /*
    ACTION
  */

  actionColumn: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  deleteBtn: {
    padding: 5,
  },

  deleteText: {
    fontSize: 14,
    color: '#777B85',
    fontWeight: '700',
  },

  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.06)',

    borderRadius: 8,

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  qtyBtn: {
    width: 28,
    height: 30,

    justifyContent: 'center',
    alignItems: 'center',
  },

  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  qtyText: {
    width: 28,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /*
    EMPTY
  */

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 15,
    color: '#777B85',
    marginBottom: 20,
    fontWeight: '600',
  },

  shopBtn: {
    backgroundColor:
      'rgba(100,85,255,0.18)',

    paddingHorizontal: 24,
    paddingVertical: 12,

    borderRadius: 10,

    borderWidth: 1,
    borderColor:
      'rgba(120,105,255,0.4)',
  },

  shopBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  /*
    CHECKOUT
  */

  checkoutSection: {
    backgroundColor:
      'rgba(5,5,7,0.92)',

    paddingHorizontal: 16,
    paddingTop: 12,

    paddingBottom:
      Platform.OS === 'ios'
        ? 32
        : 12,

    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.08)',
  },

  totalRow: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    marginBottom: 10,

    paddingHorizontal: 2,
  },

  totalLabel: {
    fontSize: 13,
    color: '#777B85',
    fontWeight: '600',
  },

  totalValue: {
    maxWidth: '58%',
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  checkoutBtn: {
    backgroundColor: '#675BFF',

    paddingVertical: 14,

    alignItems: 'center',

    borderRadius: 12,

    shadowColor: '#675BFF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },

  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /*
    CHECKOUT MODAL
  */

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

    zIndex: 999,
  },

  modalContainer: {
    width: '92%',
    maxWidth: 450,
    maxHeight: '88%',
  },

  modalCard: {
    backgroundColor: '#111118',

    padding: 20,

    borderRadius: 20,

    borderWidth: 1,
    borderColor:
      'rgba(125,113,255,0.30)',

    shadowColor: '#675BFF',
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 15,
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#999CA6',
    fontWeight: '600',
    marginBottom: 12,
  },

  addressList: {
    maxHeight: 190,
    marginBottom: 12,
  },

  noAddressText: {
    color: '#777B85',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },

  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 14,

    backgroundColor:
      'rgba(255,255,255,0.04)',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',

    marginBottom: 8,

    borderRadius: 12,
  },

  addressItemSelected: {
    borderColor:
      'rgba(105,91,255,0.8)',

    backgroundColor:
      'rgba(105,91,255,0.12)',
  },

  radioCircle: {
    width: 20,
    height: 20,

    borderRadius: 10,

    borderWidth: 2,
    borderColor: '#555862',

    marginRight: 12,

    justifyContent: 'center',
    alignItems: 'center',
  },

  radioInner: {
    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor:
      '#7C6CFF',
  },

  addressItemText: {
    flex: 1,

    color: '#B0B2BA',

    fontSize: 13,
    lineHeight: 20,
  },

  addressItemTextSelected: {
    color: '#B8B0FF',
    fontWeight: '700',
  },

  addAddressInlineBtn: {
    paddingVertical: 12,

    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.05)',

    borderRadius: 10,

    marginBottom: 15,

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  addAddressInlineText: {
    color: '#AFA7FF',
    fontSize: 14,
    fontWeight: '700',
  },

  addAddressView: {
    marginBottom: 15,
  },

  inputArea: {
    backgroundColor:
      'rgba(255,255,255,0.05)',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.1)',

    padding: 14,

    fontSize: 14,
    color: '#FFFFFF',

    borderRadius: 12,

    height: 95,

    textAlignVertical: 'top',

    marginBottom: 12,

    outlineStyle: 'none',
  },

  addAddressActions: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelAddBtn: {
    flex: 1,

    padding: 13,

    backgroundColor:
      'rgba(255,255,255,0.06)',

    alignItems: 'center',

    borderRadius: 10,
  },

  cancelAddText: {
    color: '#B0B2BA',
    fontSize: 13,
    fontWeight: '700',
  },

  saveAddBtn: {
    flex: 1,

    padding: 13,

    backgroundColor:
      '#675BFF',

    alignItems: 'center',

    borderRadius: 10,
  },

  saveAddText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /*
    SUMMARY
  */

  modalSummary: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    paddingVertical: 13,

    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.08)',

    marginBottom: 15,
  },

  summaryLabel: {
    fontSize: 13,
    color: '#777B85',
    fontWeight: '600',
  },

  summaryValue: {
    maxWidth: '55%',
    fontSize: 20,
    fontWeight: '900',
    color: '#AFA7FF',
  },

  /*
    MODAL BUTTONS
  */

  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },

  modalCancelBtn: {
    flex: 1,

    padding: 14,

    backgroundColor:
      'rgba(255,255,255,0.06)',

    alignItems: 'center',

    borderRadius: 12,
  },

  modalCancelText: {
    color: '#B0B2BA',
    fontSize: 14,
    fontWeight: '700',
  },

  modalConfirmBtn: {
    flex: 2,

    padding: 14,

    backgroundColor:
      '#675BFF',

    alignItems: 'center',

    borderRadius: 12,
  },

  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /*
    ========================================================
    PAYMENT QR
    ========================================================
  */

  paymentOverlay: {
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor:
      'rgba(0,0,0,0.86)',

    justifyContent: 'center',
    alignItems: 'center',

    padding: 16,

    zIndex: 5000,
  },

  paymentCard: {
    width: '100%',
    maxWidth: 420,

    backgroundColor:
      '#101018',

    borderRadius: 22,

    borderWidth: 1,
    borderColor:
      'rgba(110,95,255,0.45)',

    padding: 20,

    alignItems: 'center',

    shadowColor: '#675BFF',
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },

  paymentTitle: {
    color: '#FFFFFF',

    fontSize: 24,

    fontWeight: '900',

    marginBottom: 5,
  },

  paymentSubtitle: {
    color: '#8D8A9A',

    fontSize: 13,

    marginBottom: 16,

    textAlign: 'center',
  },

  qrBox: {
    width: 250,
    height: 250,

    backgroundColor:
      '#FFFFFF',

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    padding: 12,

    marginBottom: 16,
  },

  qrError: {
    color: '#EF4444',

    fontSize: 13,

    textAlign: 'center',
  },

  paymentInfo: {
    width: '100%',

    backgroundColor:
      '#181720',

    borderRadius: 14,

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.08)',

    padding: 14,

    marginBottom: 12,
  },

  paymentRow: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    marginBottom: 9,
  },

  paymentLabel: {
    color: '#85828F',

    fontSize: 13,
  },

  paymentAccount: {
    color: '#FFFFFF',

    fontSize: 14,

    fontWeight: '700',
  },

  paymentAmount: {
    color: '#A99CFF',

    fontSize: 21,

    fontWeight: '900',
  },

  paymentNote: {
    color: '#777480',

    fontSize: 11,

    textAlign: 'center',

    marginBottom: 14,
  },

  paidButton: {
    width: '100%',

    backgroundColor:
      '#6258FF',

    borderRadius: 12,

    paddingVertical: 14,

    alignItems: 'center',

    marginBottom: 9,

    shadowColor: '#6258FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },

  paidButtonText: {
    color: '#FFFFFF',

    fontSize: 15,

    fontWeight: '800',
  },

  paymentCloseButton: {
    width: '100%',

    backgroundColor:
      '#1B1A22',

    borderRadius: 12,

    paddingVertical: 12,

    alignItems: 'center',
  },

  paymentCloseText: {
    color: '#AAA7B4',

    fontSize: 14,

    fontWeight: '600',
  },

  /*
    CUSTOM ALERT
  */

  customModalOverlay: {
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor:
      'rgba(0,0,0,0.78)',

    justifyContent: 'center',
    alignItems: 'center',

    zIndex: 9999,

    padding: 20,
  },

  customModalCard: {
    backgroundColor:
      '#111118',

    width: '85%',
    maxWidth: 330,

    padding: 24,

    borderRadius: 20,

    alignItems: 'center',

    borderWidth: 1,

    borderColor:
      'rgba(125,113,255,0.30)',

    shadowColor: '#675BFF',

    shadowOpacity: 0.2,

    shadowRadius: 20,

    elevation: 10,
  },

  customModalTitle: {
    fontSize: 18,

    fontWeight: '800',

    color: '#FFFFFF',

    marginBottom: 10,

    textAlign: 'center',
  },

  customModalMessage: {
    fontSize: 14,

    color: '#A0A2AA',

    textAlign: 'center',

    marginBottom: 20,

    lineHeight: 20,
  },

  customModalBtn: {
    backgroundColor:
      '#675BFF',

    width: '100%',

    paddingVertical: 12,

    borderRadius: 12,

    alignItems: 'center',
  },

  customModalBtnText: {
    color: '#FFFFFF',

    fontSize: 15,

    fontWeight: '700',
  },
});