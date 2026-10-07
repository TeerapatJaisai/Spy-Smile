import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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

const API_BASE_URL = 'http://119.59.102.161:3100/api';

type Supplier = {
  id: number;
  name: string;
  contact?: string | null;
};

type Product = {
  id: number;
  name: string;
  brand?: string | null;
  cost_price?: string | number | null;
  stock?: number;
};

type POItem = {
  product_id: number;
  product_name: string;
  quantity: number;
  cost_price: number;
};

type PO = {
  id: number;
  supplier_id?: number;
  supplier_name: string;
  status: string;
  eta_minutes: number;
  created_at: string;
  received_at?: string | null;
  remaining_seconds: number;
  items: {
    id: number;
    product_id?: number;
    product_name: string;
    quantity: number;
    cost_price: string | number;
  }[];
};

const ETA_OPTIONS = [1, 5, 15, 30, 60];

export default function PurchaseOrderScreen() {
  const [view, setView] =
    useState<'list' | 'form'>('list');

  const [pos, setPos] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  // =====================================================
  // NEW PO
  // =====================================================

  const [selectedSupplier, setSelectedSupplier] =
    useState<Supplier | null>(null);

  const [etaMinutes, setEtaMinutes] =
    useState(5);

  const [cart, setCart] =
    useState<POItem[]>([]);

  const [submitting, setSubmitting] =
    useState(false);

  // =====================================================
  // NEW SUPPLIER
  // =====================================================

  const [supplierModalVisible, setSupplierModalVisible] =
    useState(false);

  const [supplierName, setSupplierName] =
    useState('');

  const [supplierContact, setSupplierContact] =
    useState('');

  const [savingSupplier, setSavingSupplier] =
    useState(false);

  const [searchProduct, setSearchProduct] =
    useState('');

  const pollRef = useRef<any>(null);

  // =====================================================
  // FETCH ALL
  // =====================================================

  const fetchAll = async (
    showLoading = true
  ) => {
    const role =
      Platform.OS === 'web'
        ? window.localStorage.getItem('role')
        : null;

    if (role !== 'admin') {
      router.replace('/');
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [
        posRes,
        supRes,
        prodRes,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/purchase-orders`
        ),
        fetch(
          `${API_BASE_URL}/suppliers`
        ),
        fetch(
          `${API_BASE_URL}/products`
        ),
      ]);

      if (posRes.ok) {
        const data = await posRes.json();
        setPos(
          Array.isArray(data)
            ? data
            : []
        );
      }

      if (supRes.ok) {
        const data =
          await supRes.json();

        setSuppliers(
          Array.isArray(data)
            ? data
            : []
        );
      }

      if (prodRes.ok) {
        const data =
          await prodRes.json();

        setProducts(
          Array.isArray(data)
            ? data
            : []
        );
      }
    } catch (err) {
      console.error(
        'Purchase Order fetch error:',
        err
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  // =====================================================
  // AUTO REFRESH + AUTO RECEIVE
  // =====================================================

  useEffect(() => {
    pollRef.current =
      setInterval(async () => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/purchase-orders`
          );

          if (!res.ok) {
            return;
          }

          const data: PO[] =
            await res.json();

          setPos(data);

          for (const po of data) {
            if (
              po.status === 'pending' &&
              Number(po.remaining_seconds) <= 0
            ) {
              await fetch(
                `${API_BASE_URL}/purchase-orders/${po.id}/receive`,
                {
                  method: 'POST',
                }
              );
            }
          }
        } catch (err) {
          console.error(
            'PO polling error:',
            err
          );
        }
      }, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(
          pollRef.current
        );
      }
    };
  }, []);

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = useMemo(() => {
    const keyword =
      searchProduct
        .trim()
        .toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter(
      product => {
        const name =
          String(
            product.name || ''
          ).toLowerCase();

        const brand =
          String(
            product.brand || ''
          ).toLowerCase();

        return (
          name.includes(keyword) ||
          brand.includes(keyword)
        );
      }
    );
  }, [
    products,
    searchProduct,
  ]);

  // =====================================================
  // ADD PRODUCT
  // =====================================================

  const addToCart = (
    product: Product
  ) => {
    const existing =
      cart.find(
        item =>
          item.product_id ===
          product.id
      );

    if (existing) {
      return;
    }

    setCart([
      ...cart,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        cost_price:
          Number(
            product.cost_price
          ) || 0,
      },
    ]);
  };

  // =====================================================
  // UPDATE QTY
  // =====================================================

  const updateCartQty = (
    productId: number,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map(item =>
        item.product_id ===
        productId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  };

  // =====================================================
  // REMOVE PRODUCT
  // =====================================================

  const removeFromCart = (
    productId: number
  ) => {
    setCart(
      cart.filter(
        item =>
          item.product_id !==
          productId
      )
    );
  };

  // =====================================================
  // CREATE PO
  // =====================================================

  const handleCreatePO =
    async () => {
      if (
        !selectedSupplier ||
        cart.length === 0
      ) {
        Alert.alert(
          'ข้อมูลไม่ครบ',
          'กรุณาเลือก Supplier และสินค้าอย่างน้อย 1 รายการ'
        );

        return;
      }

      setSubmitting(true);

      try {
        const res =
          await fetch(
            `${API_BASE_URL}/purchase-orders`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                supplier_id:
                  selectedSupplier.id,
                eta_minutes:
                  etaMinutes,
                items: cart,
              }),
            }
          );

        const data =
          await res.json()
            .catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data.error ||
              'สร้าง Purchase Order ไม่สำเร็จ'
          );
        }

        Alert.alert(
          'สำเร็จ',
          'สร้าง Purchase Order เรียบร้อยแล้ว'
        );

        setView('list');
        setCart([]);
        setSelectedSupplier(null);
        setEtaMinutes(5);
        setSearchProduct('');

        await fetchAll(false);
      } catch (err: any) {
        console.error(
          'Create PO error:',
          err
        );

        Alert.alert(
          'เกิดข้อผิดพลาด',
          err?.message ||
            'ไม่สามารถสร้าง Purchase Order ได้'
        );
      } finally {
        setSubmitting(false);
      }
    };

  // =====================================================
  // RECEIVE PO
  // =====================================================

  const forceReceive =
    async (poId: number) => {
      try {
        const res =
          await fetch(
            `${API_BASE_URL}/purchase-orders/${poId}/receive`,
            {
              method: 'POST',
            }
          );

        const data =
          await res.json()
            .catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data.error ||
              'รับสินค้าไม่สำเร็จ'
          );
        }

        Alert.alert(
          'สำเร็จ',
          'รับของเข้าสต็อกเรียบร้อยแล้ว'
        );

        await fetchAll(false);
      } catch (err: any) {
        console.error(
          'Receive PO error:',
          err
        );

        Alert.alert(
          'เกิดข้อผิดพลาด',
          err?.message ||
            'ไม่สามารถรับสินค้าได้'
        );
      }
    };

  // =====================================================
  // SAVE SUPPLIER
  // =====================================================

  const handleSaveSupplier =
    async () => {
      const name =
        supplierName.trim();

      const contact =
        supplierContact.trim();

      if (!name) {
        Alert.alert(
          'ข้อมูลไม่ครบ',
          'กรุณากรอกชื่อ Supplier'
        );

        return;
      }

      setSavingSupplier(true);

      try {
        const res =
          await fetch(
            `${API_BASE_URL}/suppliers`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                name,
                contact:
                  contact || null,
              }),
            }
          );

        const data =
          await res.json()
            .catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data.error ||
              'เพิ่ม Supplier ไม่สำเร็จ'
          );
        }

        Alert.alert(
          'สำเร็จ',
          'เพิ่ม Supplier เรียบร้อยแล้ว'
        );

        setSupplierName('');
        setSupplierContact('');
        setSupplierModalVisible(false);

        await fetchAll(false);
      } catch (err: any) {
        console.error(
          'Create Supplier error:',
          err
        );

        Alert.alert(
          'เกิดข้อผิดพลาด',
          err?.message ||
            'ไม่สามารถเพิ่ม Supplier ได้'
        );
      } finally {
        setSavingSupplier(false);
      }
    };

  // =====================================================
  // FORMAT COUNTDOWN
  // =====================================================

  const formatCountdown = (
    seconds: number
  ) => {
    const sec = Math.max(
      0,
      Number(seconds) || 0
    );

    const minutes =
      Math.floor(sec / 60);

    const remaining =
      sec % 60;

    return `${minutes}:${remaining
      .toString()
      .padStart(2, '0')}`;
  };

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (
    value: number | string
  ) => {
    return Number(
      value || 0
    ).toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return '-';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleDateString(
      'th-TH',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
  };

  // =====================================================
  // TOTAL ITEMS
  // =====================================================

  const totalItems =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  // =====================================================
  // TOTAL COST
  // =====================================================

  const totalCost =
    cart.reduce(
      (sum, item) =>
        sum +
        item.quantity *
          Number(
            item.cost_price || 0
          ),
      0
    );

  // =====================================================
  // SUMMARY
  // =====================================================

  const pendingCount =
    pos.filter(
      po => po.status === 'pending'
    ).length;

  const arrivedCount =
    pos.filter(
      po => po.status === 'arrived'
    ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#07090D"
        />

        <View
          style={
            styles.centerContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#8A78FF"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            กำลังโหลด Purchase Order...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // NEW PO FORM
  // =====================================================

  if (view === 'form') {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#07090D"
        />

        {/* HEADER */}
        <View
          style={styles.topHeader}
        >
          <View
            style={styles.headerLeft}
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              onPress={() =>
                setView('list')
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.backButtonText
                }
              >
                ‹
              </Text>
            </TouchableOpacity>

            <View>
              <Text
                style={
                  styles.pageTitle
                }
              >
                New Purchase Order
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                สร้างรายการสั่งซื้อสินค้าเข้าสต็อก
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={
              styles.refreshButton
            }
            onPress={() =>
              fetchAll(false)
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.refreshButtonText
              }
            >
              ↻
            </Text>

            <Text
              style={
                styles.refreshButtonLabel
              }
            >
              Refresh
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={
            styles.formContainer
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* SUPPLIER */}
          <View
            style={
              styles.sectionTitleRow
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Supplier
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                เลือกบริษัทที่จะสั่งสินค้า
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.smallAddButton
              }
              onPress={() =>
                setSupplierModalVisible(
                  true
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.smallAddButtonText
                }
              >
                + New Supplier
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={{
              paddingBottom: 6,
            }}
          >
            {suppliers.map(
              supplier => {
                const active =
                  selectedSupplier?.id ===
                  supplier.id;

                return (
                  <TouchableOpacity
                    key={
                      supplier.id
                    }
                    style={[
                      styles.supplierCard,
                      active &&
                        styles.supplierCardActive,
                    ]}
                    onPress={() =>
                      setSelectedSupplier(
                        supplier
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.supplierIcon,
                        active &&
                          styles.supplierIconActive,
                      ]}
                    >
                      <Text
                        style={
                          styles.supplierIconText
                        }
                      >
                        ▣
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.supplierName,
                        active &&
                          styles.supplierNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {supplier.name}
                    </Text>

                    <Text
                      style={
                        styles.supplierContact
                      }
                      numberOfLines={1}
                    >
                      {supplier.contact ||
                        'ไม่มีข้อมูลติดต่อ'}
                    </Text>

                    {active && (
                      <View
                        style={
                          styles.selectedMark
                        }
                      >
                        <Text>
                          ✓
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>

          {/* ETA */}
          <View
            style={
              styles.sectionBlock
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Delivery ETA
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              กำหนดเวลาจำลองที่สินค้าจะมาถึง
            </Text>

            <View
              style={styles.etaRow}
            >
              {ETA_OPTIONS.map(
                minutes => {
                  const active =
                    etaMinutes ===
                    minutes;

                  return (
                    <TouchableOpacity
                      key={
                        minutes
                      }
                      style={[
                        styles.etaChip,
                        active &&
                          styles.etaChipActive,
                      ]}
                      onPress={() =>
                        setEtaMinutes(
                          minutes
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.etaChipText,
                          active &&
                            styles.etaChipTextActive,
                        ]}
                      >
                        {minutes} นาที
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </View>

          {/* PRODUCTS */}
          <View
            style={
              styles.sectionBlock
            }
          >
            <View
              style={
                styles.sectionTitleRow
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Products
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  เลือกสินค้าที่ต้องการสั่งเข้าคลัง
                </Text>
              </View>
            </View>

            <View
              style={
                styles.searchBox
              }
            >
              <Text
                style={
                  styles.searchIcon
                }
              >
                🔎
              </Text>

              <TextInput
                value={
                  searchProduct
                }
                onChangeText={
                  setSearchProduct
                }
                placeholder="ค้นหาชื่อสินค้า หรือ Brand..."
                placeholderTextColor="#697080"
                style={
                  styles.searchInput
                }
              />
            </View>

            {filteredProducts.length === 0 ? (
              <View
                style={
                  styles.emptyProductCard
                }
              >
                <Text
                  style={
                    styles.emptyProductText
                  }
                >
                  ไม่พบสินค้า
                </Text>
              </View>
            ) : (
              filteredProducts.map(
                product => {
                  const selected =
                    cart.find(
                      item =>
                        item.product_id ===
                        product.id
                    );

                  return (
                    <View
                      key={
                        product.id
                      }
                      style={
                        styles.productCard
                      }
                    >
                      <View
                        style={
                          styles.productInfo
                        }
                      >
                        <View
                          style={
                            styles.productIcon
                          }
                        >
                          <Text
                            style={
                              styles.productIconText
                            }
                          >
                            PC
                          </Text>
                        </View>

                        <View
                          style={
                            styles.productTextWrap
                          }
                        >
                          <Text
                            style={
                              styles.productName
                            }
                            numberOfLines={2}
                          >
                            {
                              product.name
                            }
                          </Text>

                          <Text
                            style={
                              styles.productMeta
                            }
                          >
                            {product.brand ||
                              'ไม่ระบุ Brand'}
                          </Text>

                          <Text
                            style={
                              styles.productCost
                            }
                          >
                            ต้นทุน ฿
                            {formatMoney(
                              Number(
                                product.cost_price ||
                                  0
                              )
                            )}
                          </Text>
                        </View>
                      </View>

                      {!selected ? (
                        <TouchableOpacity
                          style={
                            styles.addProductButton
                          }
                          onPress={() =>
                            addToCart(
                              product
                            )
                          }
                          activeOpacity={
                            0.8
                          }
                        >
                          <Text
                            style={
                              styles.addProductButtonText
                            }
                          >
                            + เพิ่ม
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View
                          style={
                            styles.productActions
                          }
                        >
                          <TouchableOpacity
                            style={
                              styles.qtyButton
                            }
                            onPress={() =>
                              updateCartQty(
                                product.id,
                                selected.quantity -
                                  1
                              )
                            }
                          >
                            <Text
                              style={
                                styles.qtyButtonText
                              }
                            >
                              −
                            </Text>
                          </TouchableOpacity>

                          <Text
                            style={
                              styles.qtyNumber
                            }
                          >
                            {
                              selected.quantity
                            }
                          </Text>

                          <TouchableOpacity
                            style={
                              styles.qtyButton
                            }
                            onPress={() =>
                              updateCartQty(
                                product.id,
                                selected.quantity +
                                  1
                              )
                            }
                          >
                            <Text
                              style={
                                styles.qtyButtonText
                              }
                            >
                              +
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() =>
                              removeFromCart(
                                product.id
                              )
                            }
                          >
                            <Text
                              style={
                                styles.removeText
                              }
                            >
                              ลบ
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                }
              )
            )}
          </View>

          {/* SUMMARY */}
          <View
            style={
              styles.summaryCard
            }
          >
            <View>
              <Text
                style={
                  styles.summaryTitle
                }
              >
                Purchase Summary
              </Text>

              <Text
                style={
                  styles.summarySub
                }
              >
                {cart.length} รายการ · {totalItems} ชิ้น
              </Text>
            </View>

            <View
              style={
                styles.summaryPriceWrap
              }
            >
              <Text
                style={
                  styles.summaryLabel
                }
              >
                Estimated Cost
              </Text>

              <Text
                style={
                  styles.summaryPrice
                }
              >
                ฿{formatMoney(
                  totalCost
                )}
              </Text>
            </View>
          </View>

          {/* CREATE */}
          <TouchableOpacity
            style={[
              styles.createPOButton,
              (!selectedSupplier ||
                cart.length === 0 ||
                submitting) &&
                styles.disabledButton,
            ]}
            onPress={
              handleCreatePO
            }
            disabled={
              !selectedSupplier ||
              cart.length === 0 ||
              submitting
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.createPOButtonText
              }
            >
              {submitting
                ? 'กำลังสร้าง PO...'
                : 'สร้าง Purchase Order'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.cancelButton
            }
            onPress={() =>
              setView('list')
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.cancelButtonText
              }
            >
              ยกเลิก
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* SUPPLIER MODAL */}
        <Modal
          visible={
            supplierModalVisible
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setSupplierModalVisible(
              false
            )
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={
                styles.supplierModal
              }
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    New Supplier
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    เพิ่มข้อมูลบริษัทผู้จำหน่าย
                  </Text>
                </View>

                <TouchableOpacity
                  style={
                    styles.closeButton
                  }
                  onPress={() =>
                    setSupplierModalVisible(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.closeButtonText
                    }
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={
                  styles.inputLabel
                }
              >
                ชื่อบริษัท
              </Text>

              <TextInput
                value={
                  supplierName
                }
                onChangeText={
                  setSupplierName
                }
                placeholder="เช่น ASUS"
                placeholderTextColor="#697080"
                style={
                  styles.modalInput
                }
              />

              <Text
                style={
                  styles.inputLabel
                }
              >
                เบอร์ติดต่อ
              </Text>

              <TextInput
                value={
                  supplierContact
                }
                onChangeText={
                  setSupplierContact
                }
                placeholder="เช่น 02-123-4567"
                placeholderTextColor="#697080"
                keyboardType="phone-pad"
                style={
                  styles.modalInput
                }
              />

              <TouchableOpacity
                style={[
                  styles.saveSupplierButton,
                  savingSupplier &&
                    styles.disabledButton,
                ]}
                disabled={
                  savingSupplier
                }
                onPress={
                  handleSaveSupplier
                }
              >
                <Text
                  style={
                    styles.saveSupplierButtonText
                  }
                >
                  {savingSupplier
                    ? 'กำลังบันทึก...'
                    : 'บันทึก Supplier'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // =====================================================
  // PO LIST
  // =====================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#07090D"
      />

      {/* HEADER */}
      <View
        style={styles.topHeader}
      >
        <View>
          <Text
            style={styles.pageTitle}
          >
            Purchase Orders
          </Text>

          <Text
            style={styles.pageSubtitle}
          >
            จัดการ Supplier และรายการสั่งซื้อเข้าสต็อก
          </Text>
        </View>

        <View
          style={styles.headerButtons}
        >
          <TouchableOpacity
            style={
              styles.refreshButton
            }
            onPress={() =>
              fetchAll(false)
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.refreshButtonText
              }
            >
              ↻
            </Text>

            <Text
              style={
                styles.refreshButtonLabel
              }
            >
              Refresh
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.newPOButton
            }
            onPress={() =>
              setView('form')
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.newPOButtonText
              }
            >
              + New PO
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.mainPadding
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* SUMMARY CARDS */}
        <View
          style={
            styles.summaryRow
          }
        >
          <View
            style={
              styles.statCard
            }
          >
            <Text
              style={
                styles.statLabel
              }
            >
              SUPPLIERS
            </Text>

            <Text
              style={
                styles.statValue
              }
            >
              {suppliers.length}
            </Text>

            <Text
              style={
                styles.statDescription
              }
            >
              บริษัทคู่ค้า
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <Text
              style={
                styles.statLabel
              }
            >
              PENDING
            </Text>

            <Text
              style={[
                styles.statValue,
                {
                  color: '#F5C56A',
                },
              ]}
            >
              {pendingCount}
            </Text>

            <Text
              style={
                styles.statDescription
              }
            >
              รอรับสินค้า
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <Text
              style={
                styles.statLabel
              }
            >
              RECEIVED
            </Text>

            <Text
              style={[
                styles.statValue,
                {
                  color: '#76D88F',
                },
              ]}
            >
              {arrivedCount}
            </Text>

            <Text
              style={
                styles.statDescription
              }
            >
              รับของแล้ว
            </Text>
          </View>
        </View>

        {/* SUPPLIERS */}
        <View
          style={
            styles.contentCard
          }
        >
          <View
            style={
              styles.cardHeader
            }
          >
            <View>
              <Text
                style={
                  styles.cardTitle
                }
              >
                Suppliers
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                รายชื่อบริษัทคู่ค้า
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.smallAddButton
              }
              onPress={() =>
                setSupplierModalVisible(
                  true
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.smallAddButtonText
                }
              >
                + New Supplier
              </Text>
            </TouchableOpacity>
          </View>

          {suppliers.length === 0 ? (
            <View
              style={
                styles.emptySupplier
              }
            >
              <Text
                style={
                  styles.emptySupplierText
                }
              >
                ยังไม่มี Supplier
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.supplierList
              }
            >
              {suppliers.map(
                supplier => (
                  <View
                    key={
                      supplier.id
                    }
                    style={
                      styles.supplierListCard
                    }
                  >
                    <View
                      style={
                        styles.supplierListIcon
                      }
                    >
                      <Text
                        style={
                          styles.supplierIconText
                        }
                      >
                        ▣
                      </Text>
                    </View>

                    <View
                      style={
                        styles.supplierListInfo
                      }
                    >
                      <Text
                        style={
                          styles.supplierListName
                        }
                        numberOfLines={1}
                      >
                        {supplier.name}
                      </Text>

                      <Text
                        style={
                          styles.supplierListContact
                        }
                        numberOfLines={1}
                      >
                        {supplier.contact ||
                          'ไม่มีข้อมูลติดต่อ'}
                      </Text>
                    </View>
                  </View>
                )
              )}
            </ScrollView>
          )}
        </View>

        {/* RECENT PO */}
        <View
          style={
            styles.contentCard
          }
        >
          <View
            style={
              styles.cardHeader
            }
          >
            <View>
              <Text
                style={
                  styles.cardTitle
                }
              >
                Recent Purchase Orders
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                รายการสั่งซื้อล่าสุด
              </Text>
            </View>

            <Text
              style={
                styles.poCountText
              }
            >
              {pos.length} PO
            </Text>
          </View>

          {pos.length === 0 ? (
            <View
              style={
                styles.emptyPO
              }
            >
              <Text
                style={
                  styles.emptyPOIcon
                }
              >
                📦
              </Text>

              <Text
                style={
                  styles.emptyPOTitle
                }
              >
                ยังไม่มี Purchase Order
              </Text>

              <Text
                style={
                  styles.emptyPOText
                }
              >
                กด + New PO เพื่อสร้างรายการสั่งซื้อ
              </Text>

              <TouchableOpacity
                style={
                  styles.emptyPOButton
                }
                onPress={() =>
                  setView('form')
                }
              >
                <Text
                  style={
                    styles.emptyPOButtonText
                  }
                >
                  + New PO
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            pos.map(po => {
              const arrived =
                po.status ===
                'arrived';

              const totalPOCost =
                po.items.reduce(
                  (
                    sum,
                    item
                  ) =>
                    sum +
                    Number(
                      item.cost_price ||
                        0
                    ) *
                      Number(
                        item.quantity ||
                          0
                      ),
                  0
                );

              return (
                <View
                  key={po.id}
                  style={
                    styles.poCard
                  }
                >
                  <View
                    style={
                      styles.poTopRow
                    }
                  >
                    <View
                      style={
                        styles.poMainInfo
                      }
                    >
                      <Text
                        style={
                          styles.poNumber
                        }
                      >
                        PO-
                        {String(
                          po.id
                        ).padStart(
                          4,
                          '0'
                        )}
                      </Text>

                      <Text
                        style={
                          styles.poSupplier
                        }
                      >
                        {po.supplier_name}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        arrived
                          ? styles.statusArrived
                          : styles.statusPending,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              arrived
                                ? '#43D47F'
                                : '#F4B84F',
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              arrived
                                ? '#75E59B'
                                : '#FFD37B',
                          },
                        ]}
                      >
                        {arrived
                          ? 'รับของแล้ว'
                          : 'รอส่งของ'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.poDivider
                    }
                  />

                  {po.items.map(
                    (
                      item
                    ) => (
                      <View
                        key={
                          item.id
                        }
                        style={
                          styles.poItemRow
                        }
                      >
                        <Text
                          style={
                            styles.poItemName
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            item.product_name
                          }
                        </Text>

                        <Text
                          style={
                            styles.poItemQty
                          }
                        >
                          x
                          {
                            item.quantity
                          }
                        </Text>

                        <Text
                          style={
                            styles.poItemPrice
                          }
                        >
                          ฿
                          {formatMoney(
                            Number(
                              item.cost_price ||
                                0
                            ) *
                              Number(
                                item.quantity ||
                                  0
                              )
                          )}
                        </Text>
                      </View>
                    )
                  )}

                  <View
                    style={
                      styles.poBottom
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.poCreated
                        }
                      >
                        สร้างเมื่อ{' '}
                        {formatDate(
                          po.created_at
                        )}
                      </Text>

                      {arrived ? (
                        <Text
                          style={
                            styles.poReceived
                          }
                        >
                          รับของแล้ว
                          {po.received_at
                            ? ` · ${formatDate(
                                po.received_at
                              )}`
                            : ''}
                        </Text>
                      ) : (
                        <Text
                          style={
                            styles.poCountdown
                          }
                        >
                          ⏱ อีก{' '}
                          {formatCountdown(
                            po.remaining_seconds
                          )}
                        </Text>
                      )}
                    </View>

                    <View
                      style={
                        styles.poRightBottom
                      }
                    >
                      <Text
                        style={
                          styles.poTotalLabel
                        }
                      >
                        Total
                      </Text>

                      <Text
                        style={
                          styles.poTotal
                        }
                      >
                        ฿
                        {formatMoney(
                          totalPOCost
                        )}
                      </Text>
                    </View>
                  </View>

                  {!arrived && (
                    <TouchableOpacity
                      style={
                        styles.receiveButton
                      }
                      onPress={() =>
                        forceReceive(
                          po.id
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Text
                        style={
                          styles.receiveButtonText
                        }
                      >
                        รับของเข้าสต็อกเลย
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View
          style={
            styles.footerSpace
          }
        />
      </ScrollView>

      {/* SUPPLIER MODAL */}
      <Modal
        visible={
          supplierModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSupplierModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.supplierModal
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  New Supplier
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  เพิ่มข้อมูลบริษัทคู่ค้า
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.closeButton
                }
                onPress={() =>
                  setSupplierModalVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.closeButtonText
                  }
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={
                styles.inputLabel
              }
            >
              ชื่อบริษัท
            </Text>

            <TextInput
              value={
                supplierName
              }
              onChangeText={
                setSupplierName
              }
              placeholder="ASUS"
              placeholderTextColor="#697080"
              style={
                styles.modalInput
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              เบอร์ติดต่อ
            </Text>

            <TextInput
              value={
                supplierContact
              }
              onChangeText={
                setSupplierContact
              }
              placeholder="02-123-4567"
              placeholderTextColor="#697080"
              keyboardType="phone-pad"
              style={
                styles.modalInput
              }
            />

            <View
              style={
                styles.modalButtonRow
              }
            >
              <TouchableOpacity
                style={
                  styles.modalCancelButton
                }
                onPress={() =>
                  setSupplierModalVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.modalCancelText
                  }
                >
                  ยกเลิก
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveSupplierButton,
                  savingSupplier &&
                    styles.disabledButton,
                ]}
                disabled={
                  savingSupplier
                }
                onPress={
                  handleSaveSupplier
                }
              >
                <Text
                  style={
                    styles.saveSupplierButtonText
                  }
                >
                  {savingSupplier
                    ? 'กำลังบันทึก...'
                    : 'บันทึก'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {refreshing && (
        <View
          style={
            styles.refreshOverlay
          }
        >
          <ActivityIndicator
            color="#FFFFFF"
            size="small"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#07090D',
    },

    centerContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
      backgroundColor:
        '#07090D',
    },

    loadingText: {
      marginTop: 12,
      color: '#8E96A6',
      fontSize: 13,
    },

    // ===================================================
    // HEADER
    // ===================================================

    topHeader: {
      paddingHorizontal: 22,
      paddingVertical: 18,
      backgroundColor:
        '#0B0D12',
      borderBottomWidth: 1,
      borderBottomColor:
        '#1B1F28',
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    pageTitle: {
      color: '#FFFFFF',
      fontSize: 25,
      fontWeight: '900',
      letterSpacing: -0.5,
    },

    pageSubtitle: {
      marginTop: 4,
      color: '#7F8795',
      fontSize: 12,
    },

    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    refreshButton: {
      minHeight: 40,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        '#262C36',
      backgroundColor:
        '#11141A',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      justifyContent:
        'center',
    },

    refreshButtonText: {
      color: '#8E7DFF',
      fontSize: 17,
      fontWeight: '900',
    },

    refreshButtonLabel: {
      color: '#DCE0E8',
      fontSize: 11,
      fontWeight: '700',
    },

    newPOButton: {
      minHeight: 40,
      paddingHorizontal: 15,
      borderRadius: 10,
      backgroundColor:
        '#8B78FF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    newPOButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        '#11141A',
      borderWidth: 1,
      borderColor:
        '#252B35',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 12,
    },

    backButtonText: {
      fontSize: 31,
      color: '#A58FFF',
      lineHeight: 33,
    },

    // ===================================================
    // MAIN
    // ===================================================

    mainPadding: {
      padding: 22,
      paddingBottom: 30,
    },

    formContainer: {
      padding: 22,
      paddingBottom: 35,
    },

    // ===================================================
    // SUMMARY
    // ===================================================

    summaryRow: {
      flexDirection:
        'row',
      gap: 12,
      marginBottom: 16,
    },

    statCard: {
      flex: 1,
      minHeight: 108,
      backgroundColor:
        '#10131A',
      borderWidth: 1,
      borderColor:
        '#1E242E',
      borderRadius: 16,
      padding: 15,
      justifyContent:
        'space-between',
    },

    statLabel: {
      color: '#7A8391',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
    },

    statValue: {
      marginTop: 8,
      color: '#FFFFFF',
      fontSize: 25,
      fontWeight: '900',
    },

    statDescription: {
      color: '#667080',
      fontSize: 10,
    },

    // ===================================================
    // CONTENT CARD
    // ===================================================

    contentCard: {
      backgroundColor:
        '#0E1117',
      borderWidth: 1,
      borderColor:
        '#1C222C',
      borderRadius: 18,
      padding: 17,
      marginBottom: 16,
    },

    cardHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      marginBottom: 14,
    },

    cardTitle: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '900',
    },

    cardSubtitle: {
      marginTop: 4,
      color: '#6F7785',
      fontSize: 11,
    },

    poCountText: {
      color: '#8F83FF',
      fontSize: 12,
      fontWeight: '800',
    },

    smallAddButton: {
      backgroundColor:
        '#7E6BFF',
      borderRadius: 9,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    smallAddButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
    },

    // ===================================================
    // SUPPLIER LIST
    // ===================================================

    supplierList: {
      gap: 10,
      paddingBottom: 3,
    },

    supplierListCard: {
      width: 220,
      minHeight: 82,
      padding: 13,
      borderRadius: 14,
      backgroundColor:
        '#121823',
      borderWidth: 1,
      borderColor:
        '#263244',
      flexDirection:
        'row',
      alignItems: 'center',
    },

    supplierListIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(126,107,255,0.13)',
      marginRight: 11,
    },

    supplierIconText: {
      color: '#A28FFF',
      fontSize: 20,
      fontWeight: '900',
    },

    supplierListInfo: {
      flex: 1,
    },

    supplierListName: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
    },

    supplierListContact: {
      marginTop: 4,
      color: '#778191',
      fontSize: 10,
    },

    emptySupplier: {
      minHeight: 90,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    emptySupplierText: {
      color: '#616978',
      fontSize: 12,
    },

    // ===================================================
    // PO CARD
    // ===================================================

    poCard: {
      backgroundColor:
        '#121720',
      borderWidth: 1,
      borderColor:
        '#252D39',
      borderRadius: 15,
      padding: 15,
      marginBottom: 12,
    },

    poTopRow: {
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      justifyContent:
        'space-between',
    },

    poMainInfo: {
      flex: 1,
      marginRight: 10,
    },

    poNumber: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
    },

    poSupplier: {
      marginTop: 4,
      color: '#798392',
      fontSize: 11,
    },

    statusBadge: {
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
    },

    statusPending: {
      backgroundColor:
        'rgba(244,184,79,0.12)',
      borderWidth: 1,
      borderColor:
        'rgba(244,184,79,0.28)',
    },

    statusArrived: {
      backgroundColor:
        'rgba(67,212,127,0.10)',
      borderWidth: 1,
      borderColor:
        'rgba(67,212,127,0.24)',
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    statusText: {
      fontSize: 10,
      fontWeight: '900',
    },

    poDivider: {
      height: 1,
      backgroundColor:
        '#202632',
      marginVertical: 12,
    },

    poItemRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 7,
    },

    poItemName: {
      flex: 1,
      color: '#DDE1E8',
      fontSize: 12,
    },

    poItemQty: {
      width: 45,
      color: '#778292',
      fontSize: 11,
      textAlign:
        'center',
    },

    poItemPrice: {
      width: 90,
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
      textAlign:
        'right',
    },

    poBottom: {
      marginTop: 9,
      paddingTop: 11,
      borderTopWidth: 1,
      borderTopColor:
        '#202632',
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-end',
    },

    poCreated: {
      color: '#646C79',
      fontSize: 10,
    },

    poReceived: {
      marginTop: 4,
      color: '#69DC91',
      fontSize: 10,
      fontWeight: '700',
    },

    poCountdown: {
      marginTop: 4,
      color: '#F4C15F',
      fontSize: 10,
      fontWeight: '800',
    },

    poRightBottom: {
      alignItems:
        'flex-end',
    },

    poTotalLabel: {
      color: '#656E7C',
      fontSize: 9,
      textTransform:
        'uppercase',
    },

    poTotal: {
      marginTop: 2,
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
    },

    receiveButton: {
      marginTop: 12,
      height: 38,
      borderRadius: 10,
      backgroundColor:
        'rgba(126,107,255,0.12)',
      borderWidth: 1,
      borderColor:
        'rgba(126,107,255,0.35)',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    receiveButtonText: {
      color: '#AFA3FF',
      fontSize: 11,
      fontWeight: '900',
    },

    // ===================================================
    // EMPTY PO
    // ===================================================

    emptyPO: {
      paddingVertical: 35,
      alignItems:
        'center',
    },

    emptyPOIcon: {
      fontSize: 42,
    },

    emptyPOTitle: {
      marginTop: 10,
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
    },

    emptyPOText: {
      marginTop: 5,
      color: '#707988',
      fontSize: 11,
    },

    emptyPOButton: {
      marginTop: 15,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 9,
      backgroundColor:
        '#7E6BFF',
    },

    emptyPOButtonText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '900',
    },

    // ===================================================
    // FORM
    // ===================================================

    sectionBlock: {
      marginTop: 24,
    },

    sectionTitleRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      marginBottom: 12,
    },

    sectionTitle: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '900',
    },

    sectionSubtitle: {
      marginTop: 4,
      color: '#707988',
      fontSize: 11,
    },

    supplierCard: {
      width: 180,
      minHeight: 116,
      marginRight: 10,
      padding: 13,
      borderRadius: 14,
      backgroundColor:
        '#111722',
      borderWidth: 1,
      borderColor:
        '#283141',
      position: 'relative',
    },

    supplierCardActive: {
      backgroundColor:
        'rgba(126,107,255,0.10)',
      borderColor:
        '#7867F5',
    },

    supplierIcon: {
      width: 40,
      height: 40,
      borderRadius: 11,
      backgroundColor:
        'rgba(255,255,255,0.05)',
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 10,
    },

    supplierIconActive: {
      backgroundColor:
        'rgba(126,107,255,0.18)',
    },

    supplierName: {
      color: '#DDE2EA',
      fontSize: 13,
      fontWeight: '900',
    },

    supplierNameActive: {
      color: '#FFFFFF',
    },

    supplierContact: {
      marginTop: 4,
      color: '#6E7785',
      fontSize: 10,
    },

    selectedMark: {
      position: 'absolute',
      top: 9,
      right: 9,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#8B78FF',
    },

    selectedMarkText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
    },

    etaRow: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 8,
    },

    etaChip: {
      borderRadius: 20,
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor:
        '#2A323F',
      backgroundColor:
        '#11151C',
    },

    etaChipActive: {
      backgroundColor:
        '#7E6BFF',
      borderColor:
        '#7E6BFF',
    },

    etaChipText: {
      color: '#8B94A3',
      fontSize: 11,
      fontWeight: '700',
    },

    etaChipTextActive: {
      color: '#FFFFFF',
    },

    // ===================================================
    // SEARCH
    // ===================================================

    searchBox: {
      height: 46,
      borderRadius: 12,
      backgroundColor:
        '#11151C',
      borderWidth: 1,
      borderColor:
        '#262F3B',
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 12,
      marginBottom: 10,
    },

    searchIcon: {
      fontSize: 15,
      marginRight: 8,
    },

    searchInput: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 12,
    },

    // ===================================================
    // PRODUCT
    // ===================================================

    productCard: {
      minHeight: 72,
      borderRadius: 13,
      backgroundColor:
        '#10151D',
      borderWidth: 1,
      borderColor:
        '#222B36',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    productInfo: {
      flexDirection:
        'row',
      alignItems:
        'center',
      flex: 1,
      marginRight: 10,
    },

    productIcon: {
      width: 42,
      height: 42,
      borderRadius: 11,
      backgroundColor:
        'rgba(126,107,255,0.12)',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    productIconText: {
      color: '#A794FF',
      fontSize: 10,
      fontWeight: '900',
    },

    productTextWrap: {
      flex: 1,
    },

    productName: {
      color: '#E6E9EF',
      fontSize: 12,
      fontWeight: '800',
    },

    productMeta: {
      marginTop: 2,
      color: '#717A88',
      fontSize: 9,
    },

    productCost: {
      marginTop: 2,
      color: '#9E8FFF',
      fontSize: 10,
      fontWeight: '800',
    },

    addProductButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 9,
      backgroundColor:
        'rgba(126,107,255,0.11)',
      borderWidth: 1,
      borderColor:
        'rgba(126,107,255,0.26)',
    },

    addProductButtonText: {
      color: '#A594FF',
      fontSize: 11,
      fontWeight: '900',
    },

    productActions: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 8,
    },

    qtyButton: {
      width: 28,
      height: 28,
      borderRadius: 7,
      backgroundColor:
        '#161C24',
      borderWidth: 1,
      borderColor:
        '#28313D',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    qtyButtonText: {
      color: '#DDE2E9',
      fontSize: 16,
      fontWeight: '900',
    },

    qtyNumber: {
      color: '#FFFFFF',
      minWidth: 20,
      textAlign:
        'center',
      fontSize: 12,
      fontWeight: '900',
    },

    removeText: {
      color: '#EE6F84',
      fontSize: 10,
      fontWeight: '800',
      marginLeft: 2,
    },

    emptyProductCard: {
      paddingVertical: 25,
      alignItems:
        'center',
    },

    emptyProductText: {
      color: '#636D7C',
      fontSize: 11,
    },

    // ===================================================
    // SUMMARY
    // ===================================================

    summaryCard: {
      marginTop: 20,
      padding: 16,
      borderRadius: 15,
      backgroundColor:
        '#10151E',
      borderWidth: 1,
      borderColor:
        '#252E3A',
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    summaryTitle: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
    },

    summarySub: {
      marginTop: 4,
      color: '#707988',
      fontSize: 10,
    },

    summaryPriceWrap: {
      alignItems:
        'flex-end',
    },

    summaryLabel: {
      color: '#6C7481',
      fontSize: 9,
    },

    summaryPrice: {
      marginTop: 3,
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '900',
    },

    createPOButton: {
      marginTop: 15,
      height: 48,
      borderRadius: 12,
      backgroundColor:
        '#8270FF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    createPOButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
    },

    cancelButton: {
      marginTop: 9,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        '#252D38',
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#10141A',
    },

    cancelButtonText: {
      color: '#8E96A3',
      fontSize: 12,
      fontWeight: '800',
    },

    disabledButton: {
      opacity: 0.45,
    },

    footerSpace: {
      height: 20,
    },

    // ===================================================
    // MODAL
    // ===================================================

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.68)',
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 20,
    },

    supplierModal: {
      width: '100%',
      maxWidth: 440,
      backgroundColor:
        '#0E1218',
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor:
        '#29313C',
    },

    modalHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      marginBottom: 18,
    },

    modalTitle: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '900',
    },

    modalSubtitle: {
      marginTop: 4,
      color: '#737D8C',
      fontSize: 11,
    },

    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor:
        '#161B23',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    closeButtonText: {
      color: '#8F98A6',
      fontSize: 14,
      fontWeight: '900',
    },

    inputLabel: {
      color: '#9AA2AF',
      fontSize: 10,
      fontWeight: '800',
      marginBottom: 7,
      marginTop: 8,
    },

    modalInput: {
      height: 45,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        '#29313B',
      backgroundColor:
        '#11161D',
      color: '#FFFFFF',
      paddingHorizontal: 12,
      fontSize: 12,
    },

    modalButtonRow: {
      marginTop: 20,
      flexDirection:
        'row',
      gap: 9,
    },

    modalCancelButton: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        '#2A323D',
      backgroundColor:
        '#12171E',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    modalCancelText: {
      color: '#8B94A2',
      fontSize: 12,
      fontWeight: '800',
    },

    saveSupplierButton: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      backgroundColor:
        '#7F6EFF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    saveSupplierButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },

    refreshOverlay: {
      position: 'absolute',
      top: 75,
      right: 20,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(20,24,30,0.94)',
      borderWidth: 1,
      borderColor:
        '#343B48',
    },
  });