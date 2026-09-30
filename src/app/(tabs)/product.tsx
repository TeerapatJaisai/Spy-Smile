import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL =
  'http://119.59.102.161:3100/api';

const { width, height } =
  Dimensions.get('window');

type Product = {
  id: number;
  name: string;
  stock: number;
  category: string | null;
  image: string | null;
  serial_number: string | null;
  brand: string | null;
  vram: string | null;
  cost_price: number;
  selling_price: number;
};

type AlertType =
  | 'success'
  | 'error'
  | 'warning';

export default function ProductScreen() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '',
    stock: '',
    category: '',
    image: '',
    serial_number: '',
    brand: '',
    vram: '',
    cost_price: '',
    selling_price: '',
  });

  /* =========================
     APP ALERT
  ========================= */

  const [alertInfo, setAlertInfo] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as AlertType,
  });

  const showAlert = (
    title: string,
    message: string,
    type: AlertType = 'success'
  ) => {
    setAlertInfo({
      visible: true,
      title,
      message,
      type,
    });
  };

  const closeAlert = () => {
    setAlertInfo({
      visible: false,
      title: '',
      message: '',
      type: 'success',
    });
  };

  /* =========================
     DELETE CONFIRM
  ========================= */

  const [deleteProduct, setDeleteProduct] =
    useState<Product | null>(null);

  /* =========================
     LOAD PRODUCTS
  ========================= */

  useEffect(() => {
    if (Platform.OS === 'web') {
      const role =
        window.localStorage.getItem(
          'role'
        );

      setIsAdmin(
        role?.trim().toLowerCase() ===
          'admin'
      );
    }

    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/products`
      );

      if (!response.ok) {
        throw new Error(
          'ไม่สามารถโหลดสินค้าได้'
        );
      }

      const data = await response.json();

      setProducts(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error: any) {
      console.log(
        'LOAD PRODUCTS ERROR:',
        error
      );

      showAlert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถโหลดสินค้าได้',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     IMAGE URL
  ========================= */

  const getImageUrl = (
    image: string | null
  ) => {
    if (!image) return null;

    const value = image.trim();

    if (!value) return null;

    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('data:image/')
    ) {
      return value;
    }

    if (
      value.startsWith('/uploads/')
    ) {
      return `${API_URL}${value}`;
    }

    if (
      value.startsWith('uploads/')
    ) {
      return `${API_URL}/${value}`;
    }

    if (value.startsWith('/')) {
      return `${API_URL}${value}`;
    }

    return `${API_URL}/${value}`;
  };

  /* =========================
     OPEN ADD
  ========================= */

  const openAddModal = () => {
    setEditingProduct(null);

    setForm({
      name: '',
      stock: '',
      category: '',
      image: '',
      serial_number: '',
      brand: '',
      vram: '',
      cost_price: '',
      selling_price: '',
    });

    setModalVisible(true);
  };

  /* =========================
     OPEN EDIT
  ========================= */

  const openEditModal = (
    product: Product
  ) => {
    setEditingProduct(product);

    setForm({
      name: product.name || '',
      stock:
        product.stock?.toString() || '',
      category:
        product.category || '',
      image:
        product.image || '',
      serial_number:
        product.serial_number || '',
      brand:
        product.brand || '',
      vram:
        product.vram || '',
      cost_price:
        product.cost_price?.toString() ||
        '',
      selling_price:
        product.selling_price?.toString() ||
        '',
    });

    setModalVisible(true);
  };

  /* =========================
     SAVE PRODUCT
  ========================= */

  const saveProduct = async () => {
    if (!form.name.trim()) {
      showAlert(
        'ข้อมูลไม่ครบ',
        'กรุณากรอกชื่อสินค้า',
        'warning'
      );
      return;
    }

    if (!form.selling_price.trim()) {
      showAlert(
        'ข้อมูลไม่ครบ',
        'กรุณากรอกราคาขาย',
        'warning'
      );
      return;
    }

    try {
      const body = {
        name: form.name.trim(),
        stock: Number(form.stock) || 0,
        category:
          form.category.trim() || null,
        image:
          form.image.trim() || null,
        serial_number:
          form.serial_number.trim() ||
          null,
        brand:
          form.brand.trim() || null,
        vram:
          form.vram.trim() || null,
        cost_price:
          Number(form.cost_price) || 0,
        selling_price:
          Number(form.selling_price) || 0,
      };

      let response;

      if (editingProduct) {
        response = await fetch(
          `${API_URL}/products/${editingProduct.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(body),
          }
        );
      } else {
        response = await fetch(
          `${API_URL}/products`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(body),
          }
        );
      }

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            'บันทึกสินค้าไม่สำเร็จ'
        );
      }

      setModalVisible(false);

      await loadProducts();

      showAlert(
        editingProduct
          ? 'แก้ไขสินค้าสำเร็จ'
          : 'เพิ่มสินค้าสำเร็จ',
        editingProduct
          ? 'ข้อมูลสินค้าถูกแก้ไขแล้ว'
          : 'เพิ่มสินค้าเข้าสู่ระบบแล้ว',
        'success'
      );
    } catch (error: any) {
      console.log(
        'SAVE PRODUCT ERROR:',
        error
      );

      showAlert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถบันทึกสินค้าได้',
        'error'
      );
    }
  };

  /* =========================
     DELETE
  ========================= */

  const askDelete = (
    product: Product
  ) => {
    setDeleteProduct(product);
  };

  const confirmDelete = async () => {
    if (!deleteProduct) return;

    try {
      const response =
        await fetch(
          `${API_URL}/products/${deleteProduct.id}`,
          {
            method: 'DELETE',
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            'ลบสินค้าไม่สำเร็จ'
        );
      }

      const deletedName =
        deleteProduct.name;

      setDeleteProduct(null);

      await loadProducts();

      showAlert(
        'ลบสินค้าสำเร็จ',
        `${deletedName} ถูกลบออกจากระบบแล้ว`,
        'success'
      );
    } catch (error: any) {
      console.log(
        'DELETE PRODUCT ERROR:',
        error
      );

      setDeleteProduct(null);

      showAlert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถลบสินค้าได้',
        'error'
      );
    }
  };

  /* =========================
     ADD TO CART
  ========================= */

  const addToCart = async (
    product: Product
  ) => {
    if (Number(product.stock) <= 0) {
      showAlert(
        'สินค้าหมด',
        'สินค้านี้ไม่มีสินค้าในสต็อก',
        'error'
      );
      return;
    }

    try {
      let userId: string | null =
        null;

      if (Platform.OS === 'web') {
        userId =
          window.localStorage.getItem(
            'userId'
          );
      }

      if (!userId) {
        showAlert(
          'กรุณาเข้าสู่ระบบ',
          'กรุณาเข้าสู่ระบบก่อนซื้อสินค้า',
          'warning'
        );
        return;
      }

      const response =
        await fetch(
          `${API_URL}/cart`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              user_id: Number(userId),
              product_id: product.id,
              quantity: 1,
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            'เพิ่มสินค้าลงตะกร้าไม่สำเร็จ'
        );
      }

      showAlert(
        'เพิ่มสินค้าแล้ว',
        `${product.name} ถูกเพิ่มลงตะกร้าแล้ว`,
        'success'
      );
    } catch (error: any) {
      console.log(
        'ADD TO CART ERROR:',
        error
      );

      showAlert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้',
        'error'
      );
    }
  };

  /* =========================
     SEARCH
  ========================= */

  const filteredProducts =
    products.filter((product) => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) return true;

      return (
        product.name
          ?.toLowerCase()
          .includes(keyword) ||
        product.brand
          ?.toLowerCase()
          .includes(keyword) ||
        product.category
          ?.toLowerCase()
          .includes(keyword) ||
        product.serial_number
          ?.toLowerCase()
          .includes(keyword)
      );
    });

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <View style={styles.container}>
        <SpaceBackground />

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#635BFF"
          />

          <Text
            style={styles.loadingText}
          >
            LOADING PRODUCTS...
          </Text>
        </View>
      </View>
    );
  }

  /* =========================
     MAIN
  ========================= */

  return (
    <View style={styles.container}>
      <SpaceBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text
              style={styles.smallTitle}
            >
              STORE
            </Text>

            <Text
              style={styles.pageTitle}
            >
              Products
            </Text>

            <Text
              style={styles.pageSubtitle}
            >
              Choose your IT products
            </Text>
          </View>

          {isAdmin && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={openAddModal}
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.addButtonText
                }
              >
                + Add
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SEARCH */}

        <View style={styles.searchBox}>
          <Text
            style={styles.searchIcon}
          >
            ⌕
          </Text>

          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor="#555967"
          />

          <View
            style={styles.productCount}
          >
            <Text
              style={
                styles.productCountLabel
              }
            >
              PRODUCTS
            </Text>

            <Text
              style={
                styles.productCountNumber
              }
            >
              {filteredProducts.length}
            </Text>
          </View>
        </View>

        {/* PRODUCTS */}

        {filteredProducts.length === 0 ? (
          <View
            style={styles.emptyBox}
          >
            <Text
              style={styles.emptyIcon}
            >
              📦
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              No products found
            </Text>

            <Text
              style={styles.emptyText}
            >
              ยังไม่มีสินค้าที่ตรงกับการค้นหา
            </Text>
          </View>
        ) : (
          filteredProducts.map(
            (product) => {
              const imageUrl =
                getImageUrl(
                  product.image
                );

              return (
                <View
                  key={product.id}
                  style={
                    styles.productCard
                  }
                >
                  {/* IMAGE */}

                  <View
                    style={
                      styles.imageBox
                    }
                  >
                    {imageUrl ? (
                      <Image
                        source={{
                          uri: imageUrl,
                        }}
                        style={
                          styles.productImage
                        }
                        resizeMode="contain"
                      />
                    ) : (
                      <Text
                        style={
                          styles.noImage
                        }
                      >
                        NO IMAGE
                      </Text>
                    )}
                  </View>

                  {/* INFO */}

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
                      {product.name}
                    </Text>

                    <Text
                      style={
                        styles.productBrand
                      }
                    >
                      {product.brand ||
                        'IT PRODUCT'}
                    </Text>

                    <View
                      style={
                        styles.tags
                      }
                    >
                      <View
                        style={
                          styles.categoryTag
                        }
                      >
                        <Text
                          style={
                            styles.categoryTagText
                          }
                        >
                          {product.category ||
                            'Uncategorized'}
                        </Text>
                      </View>

                      {product.vram && (
                        <View
                          style={
                            styles.vramTag
                          }
                        >
                          <Text
                            style={
                              styles.vramTagText
                            }
                          >
                            {product.vram}
                          </Text>
                        </View>
                      )}
                    </View>

                    {product.serial_number && (
                      <Text
                        style={
                          styles.serialText
                        }
                      >
                        S/N:{' '}
                        {
                          product.serial_number
                        }
                      </Text>
                    )}
                  </View>

                  {/* PRICE */}

                  <View
                    style={
                      styles.priceSection
                    }
                  >
                    <Text
                      style={
                        styles.priceLabel
                      }
                    >
                      PRICE
                    </Text>

                    <Text
                      style={
                        styles.priceText
                      }
                    >
                      ฿
                      {Number(
                        product.selling_price
                      ).toLocaleString()}
                    </Text>

                    {isAdmin && (
                      <>
                        <Text
                          style={
                            styles.costLabel
                          }
                        >
                          COST
                        </Text>

                        <Text
                          style={
                            styles.costText
                          }
                        >
                          ฿
                          {Number(
                            product.cost_price
                          ).toLocaleString()}
                        </Text>
                      </>
                    )}
                  </View>

                  {/* STOCK */}

                  <View
                    style={
                      styles.stockSection
                    }
                  >
                    <Text
                      style={
                        styles.stockLabel
                      }
                    >
                      STOCK
                    </Text>

                    <View
                      style={[
                        styles.stockBadge,
                        Number(
                          product.stock
                        ) <= 0 &&
                          styles.stockBadgeEmpty,
                        Number(
                          product.stock
                        ) > 0 &&
                          Number(
                            product.stock
                          ) <= 5 &&
                          styles.stockBadgeLow,
                      ]}
                    >
                      <Text
                        style={
                          styles.stockText
                        }
                      >
                        {product.stock}
                      </Text>
                    </View>
                  </View>

                  {/* ACTIONS */}

                  <View
                    style={
                      styles.actionSection
                    }
                  >
                    {isAdmin ? (
                      <>
                        <TouchableOpacity
                          style={
                            styles.editButton
                          }
                          onPress={() =>
                            openEditModal(
                              product
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Text
                            style={
                              styles.editButtonText
                            }
                          >
                            Edit
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={
                            styles.deleteButton
                          }
                          onPress={() =>
                            askDelete(
                              product
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Text
                            style={
                              styles.deleteButtonText
                            }
                          >
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.buyButton,
                          Number(
                            product.stock
                          ) <= 0 &&
                            styles.buyButtonDisabled,
                        ]}
                        onPress={() =>
                          addToCart(
                            product
                          )
                        }
                        disabled={
                          Number(
                            product.stock
                          ) <= 0
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={
                            styles.cartIcon
                          }
                        >
                          🛒
                        </Text>

                        <Text
                          style={
                            styles.buyButtonText
                          }
                        >
                          {Number(
                            product.stock
                          ) <= 0
                            ? 'Out of Stock'
                            : 'Buy'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }
          )
        )}
      </ScrollView>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.formModal
            }
          >
            <ScrollView
              showsVerticalScrollIndicator={
                false
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
                    {editingProduct
                      ? 'Edit Product'
                      : 'Add Product'}
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    {editingProduct
                      ? 'Update product information'
                      : 'Create a new product'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={
                    styles.closeButton
                  }
                  onPress={() =>
                    setModalVisible(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.closeButtonText
                    }
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              {/* NAME */}

              <FormInput
                label="PRODUCT NAME"
                value={form.name}
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    name: value,
                  })
                }
                placeholder="Enter product name"
              />

              {/* BRAND */}

              <FormInput
                label="BRAND"
                value={form.brand}
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    brand: value,
                  })
                }
                placeholder="Enter brand"
              />

              {/* CATEGORY */}

              <FormInput
                label="CATEGORY"
                value={form.category}
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    category: value,
                  })
                }
                placeholder="GPU / CPU / RAM..."
              />

              {/* SERIAL */}

              <FormInput
                label="SERIAL NUMBER"
                value={
                  form.serial_number
                }
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    serial_number:
                      value,
                  })
                }
                placeholder="Enter serial number"
              />

              {/* VRAM */}

              <FormInput
                label="VRAM"
                value={form.vram}
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    vram: value,
                  })
                }
                placeholder="8GB / 12GB / 24GB..."
              />

              {/* STOCK */}

              <FormInput
                label="STOCK"
                value={form.stock}
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    stock: value,
                  })
                }
                placeholder="0"
                keyboardType="numeric"
              />

              {/* COST */}

              <FormInput
                label="COST PRICE"
                value={
                  form.cost_price
                }
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    cost_price:
                      value,
                  })
                }
                placeholder="0"
                keyboardType="numeric"
              />

              {/* SELLING */}

              <FormInput
                label="SELLING PRICE"
                value={
                  form.selling_price
                }
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    selling_price:
                      value,
                  })
                }
                placeholder="0"
                keyboardType="numeric"
              />

              {/* IMAGE */}

              <FormInput
                label="IMAGE URL"
                value={form.image}
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    image: value,
                  })
                }
                placeholder="https://..."
              />

              {/* IMAGE PREVIEW */}

              {getImageUrl(
                form.image
              ) && (
                <View
                  style={
                    styles.previewBox
                  }
                >
                  <Text
                    style={
                      styles.previewLabel
                    }
                  >
                    IMAGE PREVIEW
                  </Text>

                  <Image
                    source={{
                      uri:
                        getImageUrl(
                          form.image
                        ) || '',
                    }}
                    style={
                      styles.previewImage
                    }
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* SAVE */}

              <TouchableOpacity
                style={
                  styles.saveButton
                }
                onPress={
                  saveProduct
                }
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {editingProduct
                    ? 'SAVE CHANGES'
                    : 'ADD PRODUCT'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={() =>
                  setModalVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  CANCEL
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =================================================
          DELETE CONFIRM MODAL
      ================================================= */}

      <Modal
        visible={
          deleteProduct !== null
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setDeleteProduct(null)
        }
      >
        <View
          style={
            styles.alertOverlay
          }
        >
          <View
            style={
              styles.alertCard
            }
          >
            <View
              style={[
                styles.alertIcon,
                styles.alertIconError,
              ]}
            >
              <Text
                style={
                  styles.alertIconText
                }
              >
                !
              </Text>
            </View>

            <Text
              style={
                styles.alertTitle
              }
            >
              ลบสินค้า?
            </Text>

            <Text
              style={
                styles.alertMessage
              }
            >
              คุณต้องการลบ
              {'\n'}
              <Text
                style={
                  styles.alertProductName
                }
              >
                {deleteProduct?.name}
              </Text>
              {'\n'}
              ออกจากระบบหรือไม่?
            </Text>

            <View
              style={
                styles.confirmRow
              }
            >
              <TouchableOpacity
                style={
                  styles.confirmCancel
                }
                onPress={() =>
                  setDeleteProduct(
                    null
                  )
                }
              >
                <Text
                  style={
                    styles.confirmCancelText
                  }
                >
                  ยกเลิก
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.confirmDelete
                }
                onPress={
                  confirmDelete
                }
              >
                <Text
                  style={
                    styles.confirmDeleteText
                  }
                >
                  ลบสินค้า
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =================================================
          APP ALERT
      ================================================= */}

      <Modal
        visible={
          alertInfo.visible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeAlert
        }
      >
        <View
          style={
            styles.alertOverlay
          }
        >
          <View
            style={
              styles.alertCard
            }
          >
            <View
              style={[
                styles.alertIcon,
                alertInfo.type ===
                  'error'
                  ? styles.alertIconError
                  : alertInfo.type ===
                      'warning'
                    ? styles.alertIconWarning
                    : styles.alertIconSuccess,
              ]}
            >
              <Text
                style={
                  styles.alertIconText
                }
              >
                {alertInfo.type ===
                'error'
                  ? '!'
                  : alertInfo.type ===
                      'warning'
                    ? '!'
                    : '✓'}
              </Text>
            </View>

            <Text
              style={
                styles.alertTitle
              }
            >
              {alertInfo.title}
            </Text>

            <Text
              style={
                styles.alertMessage
              }
            >
              {alertInfo.message}
            </Text>

            <TouchableOpacity
              style={[
                styles.alertButton,
                alertInfo.type ===
                  'error' &&
                  styles.alertButtonError,
                alertInfo.type ===
                  'warning' &&
                  styles.alertButtonWarning,
              ]}
              onPress={
                closeAlert
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.alertButtonText
                }
              >
                ตกลง
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =====================================================
   FORM INPUT
===================================================== */

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder: string;
  keyboardType?:
    | 'default'
    | 'numeric';
}) {
  return (
    <View
      style={
        styles.formGroup
      }
    >
      <Text
        style={
          styles.formLabel
        }
      >
        {label}
      </Text>

      <TextInput
        style={
          styles.formInput
        }
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor="#555967"
        keyboardType={
          keyboardType ||
          'default'
        }
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

/* =====================================================
   SPACE BACKGROUND
===================================================== */

function SpaceBackground() {
  const stars = [
    { x: 0.05, y: 0.10, size: 2 },
    { x: 0.12, y: 0.22, size: 1 },
    { x: 0.20, y: 0.07, size: 2 },
    { x: 0.28, y: 0.16, size: 1 },
    { x: 0.36, y: 0.08, size: 2 },
    { x: 0.45, y: 0.20, size: 1 },
    { x: 0.55, y: 0.09, size: 2 },
    { x: 0.64, y: 0.18, size: 1 },
    { x: 0.73, y: 0.07, size: 2 },
    { x: 0.84, y: 0.16, size: 1 },
    { x: 0.94, y: 0.08, size: 2 },

    { x: 0.06, y: 0.45, size: 1 },
    { x: 0.18, y: 0.56, size: 2 },
    { x: 0.31, y: 0.43, size: 1 },
    { x: 0.68, y: 0.48, size: 2 },
    { x: 0.87, y: 0.56, size: 1 },

    { x: 0.08, y: 0.78, size: 2 },
    { x: 0.22, y: 0.90, size: 1 },
    { x: 0.39, y: 0.78, size: 2 },
    { x: 0.57, y: 0.88, size: 1 },
    { x: 0.76, y: 0.76, size: 2 },
    { x: 0.92, y: 0.90, size: 1 },
  ];

  const meteors = [
    {
      x: width * 0.90,
      y: height * 0.08,
    },
    {
      x: width * 0.72,
      y: height * 0.15,
    },
    {
      x: width * 0.45,
      y: height * 0.05,
    },
    {
      x: width * 0.95,
      y: height * 0.35,
    },
    {
      x: width * 0.65,
      y: height * 0.28,
    },
  ];

  return (
    <View
      pointerEvents="none"
      style={
        StyleSheet.absoluteFill
      }
    >
      <View
        style={
          styles.spaceBase
        }
      />

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

      {stars.map(
        (star, index) => (
          <View
            key={`star-${index}`}
            style={[
              styles.star,
              {
                left:
                  width *
                  star.x,
                top:
                  height *
                  star.y,
                width:
                  star.size,
                height:
                  star.size,
                borderRadius:
                  star.size /
                  2,
              },
            ]}
          />
        )
      )}

      {meteors.map(
        (meteor, index) => (
          <View
            key={`meteor-${index}`}
            style={[
              styles.thinMeteor,
              {
                left:
                  meteor.x,
                top:
                  meteor.y,
              },
            ]}
          >
            <View
              style={
                styles.meteorLong
              }
            />

            <View
              style={
                styles.meteorMid
              }
            />

            <View
              style={
                styles.meteorBright
              }
            />

            <View
              style={
                styles.meteorPoint
              }
            />
          </View>
        )
      )}

      <View
        style={
          styles.bottomGlow
        }
      />
    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030408',
  },

  scroll: {
    flex: 1,
  },

  content: {
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
    paddingHorizontal:
      width < 600 ? 14 : 28,
    paddingTop:
      width < 600 ? 28 : 38,
    paddingBottom: 110,
  },

  /* =========================
     BACKGROUND
  ========================== */

  spaceBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#030408',
  },

  spaceGlow: {
    position: 'absolute',
    width: 430,
    height: 430,
    borderRadius: 215,
  },

  spaceGlowBlue: {
    left: -170,
    top: height * 0.05,
    backgroundColor:
      'rgba(35,70,180,0.10)',
    shadowColor: '#315CFF',
    shadowOpacity: 0.35,
    shadowRadius: 100,
  },

  spaceGlowPurple: {
    right: -170,
    bottom: height * 0.05,
    backgroundColor:
      'rgba(95,45,180,0.10)',
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.35,
    shadowRadius: 100,
  },

  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.55,
  },

  thinMeteor: {
    position: 'absolute',
    width: 4,
    height: 4,
  },

  meteorLong: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 120,
    height: 1,
    backgroundColor:
      'rgba(255,215,130,0.15)',
  },

  meteorMid: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 75,
    height: 1,
    backgroundColor:
      'rgba(255,230,175,0.40)',
  },

  meteorBright: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 32,
    height: 1,
    backgroundColor: '#FFF8E8',
  },

  meteorPoint: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  bottomGlow: {
    position: 'absolute',
    width: width * 1.2,
    height: 180,
    borderRadius: 200,
    bottom: -120,
    backgroundColor:
      'rgba(60,45,150,0.08)',
  },

  /* =========================
     LOADING
  ========================== */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#777D91',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 15,
  },

  /* =========================
     HEADER
  ========================== */

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },

  smallTitle: {
    color: '#7168FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 5,
  },

  pageTitle: {
    color: '#FFFFFF',
    fontSize:
      width < 600 ? 30 : 36,
    fontWeight: '900',
    letterSpacing: -1,
  },

  pageSubtitle: {
    color: '#626878',
    fontSize: 11,
    marginTop: 4,
  },

  addButton: {
    backgroundColor:
      'rgba(99,91,255,0.18)',
    borderWidth: 1,
    borderColor:
      'rgba(120,110,255,0.55)',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* =========================
     SEARCH
  ========================== */

  searchBox: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      'rgba(8,10,18,0.82)',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',

    borderRadius: 15,

    paddingLeft: 16,
    paddingRight: 8,

    marginBottom: 16,
  },

  searchIcon: {
    color: '#626878',
    fontSize: 24,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    outlineStyle: 'none',
  },

  productCount: {
    height: 38,
    minWidth: 90,
    paddingHorizontal: 12,
    borderRadius: 10,

    backgroundColor:
      'rgba(255,255,255,0.025)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  productCountLabel: {
    color: '#555967',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },

  productCountNumber: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },

  /* =========================
     PRODUCT CARD
  ========================== */

  productCard: {
    minHeight: 114,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      'rgba(8,10,18,0.82)',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',

    borderRadius: 17,

    padding: 12,
    marginBottom: 10,
  },

  imageBox: {
    width:
      width < 600 ? 86 : 90,
    height:
      width < 600 ? 86 : 90,

    borderRadius: 12,

    backgroundColor:
      '#111217',

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  noImage: {
    color: '#4E5260',
    fontSize: 8,
    fontWeight: '800',
  },

  productInfo: {
    flex: 1,
    paddingHorizontal: 14,
    minWidth: 0,
  },

  productName: {
    color: '#E8E9EF',
    fontSize:
      width < 600 ? 13 : 15,
    fontWeight: '800',
    lineHeight: 19,
  },

  productBrand: {
    color: '#5F6472',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
    textTransform: 'uppercase',
  },

  tags: {
    flexDirection: 'row',
    marginTop: 7,
    gap: 5,
  },

  categoryTag: {
    backgroundColor:
      'rgba(99,91,255,0.10)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  categoryTagText: {
    color: '#8077FF',
    fontSize: 8,
    fontWeight: '700',
  },

  vramTag: {
    backgroundColor:
      'rgba(255,255,255,0.035)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  vramTagText: {
    color: '#727684',
    fontSize: 8,
    fontWeight: '700',
  },

  serialText: {
    color: '#4F5360',
    fontSize: 8,
    marginTop: 6,
  },

  /* =========================
     PRICE
  ========================== */

  priceSection: {
    width:
      width < 600 ? 100 : 120,
    alignItems: 'flex-start',
  },

  priceLabel: {
    color: '#555967',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },

  priceText: {
    color: '#E6E7EC',
    fontSize:
      width < 600 ? 14 : 16,
    fontWeight: '900',
    marginTop: 4,
  },

  costLabel: {
    color: '#555967',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 7,
  },

  costText: {
    color: '#777D91',
    fontSize: 10,
    marginTop: 2,
  },

  /* =========================
     STOCK
  ========================== */

  stockSection: {
    width: 65,
    alignItems: 'center',
  },

  stockLabel: {
    color: '#555967',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
  },

  stockBadge: {
    minWidth: 38,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,

    backgroundColor:
      'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(34,197,94,0.18)',

    alignItems: 'center',
  },

  stockBadgeLow: {
    backgroundColor:
      'rgba(245,158,11,0.10)',
    borderColor:
      'rgba(245,158,11,0.25)',
  },

  stockBadgeEmpty: {
    backgroundColor:
      'rgba(244,63,94,0.10)',
    borderColor:
      'rgba(244,63,94,0.25)',
  },

  stockText: {
    color: '#6DD69A',
    fontSize: 11,
    fontWeight: '900',
  },

  /* =========================
     ACTION
  ========================== */

  actionSection: {
    width:
      width < 600 ? 90 : 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  buyButton: {
    width:
      width < 600 ? 78 : 86,
    height: 38,

    borderRadius: 10,

    backgroundColor: '#635BFF',

    alignItems: 'center',
    justifyContent: 'center',

    flexDirection: 'row',

    shadowColor: '#635BFF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },

  buyButtonDisabled: {
    opacity: 0.35,
  },

  cartIcon: {
    fontSize: 12,
    marginRight: 5,
  },

  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  editButton: {
    width: 82,
    height: 34,
    borderRadius: 9,

    backgroundColor:
      'rgba(99,91,255,0.15)',

    borderWidth: 1,
    borderColor:
      'rgba(99,91,255,0.35)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  editButtonText: {
    color: '#8C84FF',
    fontSize: 10,
    fontWeight: '800',
  },

  deleteButton: {
    width: 82,
    height: 34,
    borderRadius: 9,

    backgroundColor:
      'rgba(244,63,94,0.08)',

    borderWidth: 1,
    borderColor:
      'rgba(244,63,94,0.22)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonText: {
    color: '#F36A82',
    fontSize: 10,
    fontWeight: '800',
  },

  /* =========================
     EMPTY
  ========================== */

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 15,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  emptyText: {
    color: '#626878',
    fontSize: 11,
    marginTop: 6,
  },

  /* =========================
     FORM MODAL
  ========================== */

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },

  formModal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',

    backgroundColor: '#090B12',

    borderRadius: 22,

    borderWidth: 1,
    borderColor:
      'rgba(108,98,255,0.30)',

    padding: 22,

    shadowColor: '#6258FF',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },

  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: '#626878',
    fontSize: 10,
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,

    backgroundColor:
      'rgba(255,255,255,0.05)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    color: '#A0A4B0',
    fontSize: 24,
    lineHeight: 27,
  },

  formGroup: {
    marginBottom: 15,
  },

  formLabel: {
    color: '#858A9A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 7,
  },

  formInput: {
    height: 46,

    backgroundColor:
      'rgba(255,255,255,0.035)',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',

    borderRadius: 10,

    color: '#FFFFFF',
    fontSize: 13,

    paddingHorizontal: 13,

    outlineStyle: 'none',
  },

  previewBox: {
    marginTop: 2,
    marginBottom: 16,

    backgroundColor:
      'rgba(255,255,255,0.025)',

    borderRadius: 12,

    padding: 10,

    alignItems: 'center',
  },

  previewLabel: {
    color: '#555967',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  previewImage: {
    width: 150,
    height: 110,
  },

  saveButton: {
    height: 48,
    borderRadius: 11,

    backgroundColor: '#635BFF',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 5,

    shadowColor: '#635BFF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  cancelButton: {
    height: 45,
    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 8,
  },

  cancelButtonText: {
    color: '#686D7B',
    fontSize: 10,
    fontWeight: '800',
  },

  /* =========================
     ALERT
  ========================== */

  alertOverlay: {
    flex: 1,

    backgroundColor:
      'rgba(0,0,0,0.72)',

    alignItems: 'center',
    justifyContent: 'center',

    padding: 20,

    zIndex: 9999,
  },

  alertCard: {
    width: '88%',
    maxWidth: 390,

    backgroundColor: '#0A0B12',

    borderRadius: 22,

    paddingHorizontal: 24,
    paddingVertical: 26,

    alignItems: 'center',

    borderWidth: 1,
    borderColor:
      'rgba(108,98,255,0.35)',

    shadowColor: '#6258FF',
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: 12,
    },

    elevation: 15,
  },

  alertIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 16,

    borderWidth: 1,
  },

  alertIconSuccess: {
    backgroundColor:
      'rgba(99,91,255,0.18)',
    borderColor:
      'rgba(125,115,255,0.55)',

    shadowColor: '#635BFF',
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },

  alertIconError: {
    backgroundColor:
      'rgba(244,63,94,0.15)',
    borderColor:
      'rgba(244,63,94,0.5)',

    shadowColor: '#F43F5E',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },

  alertIconWarning: {
    backgroundColor:
      'rgba(245,158,11,0.13)',
    borderColor:
      'rgba(245,158,11,0.45)',

    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },

  alertIconText: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
  },

  alertTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },

  alertMessage: {
    color: '#8D91A0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },

  alertProductName: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  alertButton: {
    width: '100%',
    height: 46,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#635BFF',

    borderWidth: 1,
    borderColor:
      'rgba(150,140,255,0.6)',

    shadowColor: '#635BFF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },

  alertButtonError: {
    backgroundColor: '#D93656',
    borderColor:
      'rgba(255,100,125,0.5)',
    shadowColor: '#F43F5E',
  },

  alertButtonWarning: {
    backgroundColor: '#B7791F',
    borderColor:
      'rgba(255,190,70,0.4)',
    shadowColor: '#F59E0B',
  },

  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  /* =========================
     DELETE CONFIRM
  ========================== */

  confirmRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },

  confirmCancel: {
    flex: 1,
    height: 45,
    borderRadius: 11,

    backgroundColor:
      'rgba(255,255,255,0.05)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmCancelText: {
    color: '#858A9A',
    fontSize: 11,
    fontWeight: '800',
  },

  confirmDelete: {
    flex: 1,
    height: 45,
    borderRadius: 11,

    backgroundColor:
      '#D93656',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor:
      'rgba(255,100,125,0.4)',
  },

  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});