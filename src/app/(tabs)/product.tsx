import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'http://119.59.102.161:3100/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

type Product = {
  id: number;
  name: string;
  stock: number;
  category: string | null;
  image: string | null;
  serial_number: string | null;
  brand: string | null;
  vram: string | number | null;
  cost_price: number;
  selling_price: number;
};

export default function ProductScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [showDetail, setShowDetail] =
    useState(false);

  const [showForm, setShowForm] =
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

  const [alertInfo, setAlertInfo] = useState({
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

  // ============================================================
  // CHECK ROLE + LOAD
  // ============================================================

  useEffect(() => {
    if (Platform.OS === 'web') {
      const role =
        window.localStorage.getItem('role');

      setIsAdmin(
        role?.trim().toLowerCase() === 'admin'
      );
    }

    loadProducts();
  }, []);

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  const loadProducts = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/products`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'โหลดข้อมูลสินค้าไม่สำเร็จ'
        );
      }

      setProducts(
        Array.isArray(data)
          ? data
          : data.products || []
      );
    } catch (error: any) {
      console.log(
        'LOAD PRODUCTS ERROR:',
        error
      );

      showAlert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถโหลดสินค้าได้'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // IMAGE URL
  // ============================================================

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

    if (value.startsWith('/')) {
      return `${API_URL}${value}`;
    }

    return `${API_URL}/${value}`;
  };

  // ============================================================
  // FILTER
  // ============================================================

  const filteredProducts =
    products.filter((product) => {
      const keyword =
        search.trim().toLowerCase();

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
        String(product.vram || '')
          .toLowerCase()
          .includes(keyword)
      );
    });

  // ============================================================
  // ADD TO CART
  // ============================================================

  const addToCart = async (
    product: Product
  ) => {
    if (Number(product.stock) <= 0) {
      showAlert(
        'สินค้าหมด',
        'สินค้านี้ไม่มีสินค้าในสต็อก'
      );
      return;
    }

    try {
      let userId: string | null = null;

      if (Platform.OS === 'web') {
        userId =
          window.localStorage.getItem(
            'userId'
          );
      }

      if (!userId) {
        showAlert(
          'กรุณาเข้าสู่ระบบ',
          'กรุณาเข้าสู่ระบบก่อนซื้อสินค้า'
        );
        return;
      }

      const response = await fetch(
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
        `${product.name} ถูกเพิ่มลงตะกร้าแล้ว`
      );
    } catch (error: any) {
      console.log(
        'ADD TO CART ERROR:',
        error
      );

      showAlert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้'
      );
    }
  };

  // ============================================================
  // OPEN DETAIL
  // ============================================================

  const openDetail = (
    product: Product
  ) => {
    setSelectedProduct(product);
    setShowDetail(true);
  };

  // ============================================================
  // OPEN ADD
  // ============================================================

  const openAdd = () => {
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

    setShowForm(true);
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEdit = (
    product: Product
  ) => {
    setEditingProduct(product);

    setForm({
      name: product.name || '',
      stock: String(
        product.stock ?? ''
      ),
      category:
        product.category || '',
      image: product.image || '',
      serial_number:
        product.serial_number || '',
      brand: product.brand || '',
      vram:
        product.vram !== null &&
        product.vram !== undefined
          ? String(product.vram)
          : '',
      cost_price: String(
        product.cost_price ?? ''
      ),
      selling_price: String(
        product.selling_price ?? ''
      ),
    });

    setShowForm(true);
  };

  // ============================================================
  // SAVE PRODUCT
  // ============================================================

  const saveProduct = async () => {
    if (!form.name.trim()) {
      showAlert(
        'ข้อมูลไม่ครบ',
        'กรุณากรอกชื่อสินค้า'
      );
      return;
    }

    try {
      const body = {
        name: form.name.trim(),
        stock:
          Number(form.stock) || 0,
        category:
          form.category.trim() ||
          null,
        image:
          form.image.trim() ||
          null,
        serial_number:
          form.serial_number.trim() ||
          null,
        brand:
          form.brand.trim() ||
          null,
        vram:
          form.vram.trim() ||
          null,
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

      setShowForm(false);

      showAlert(
        'สำเร็จ',
        editingProduct
          ? 'แก้ไขสินค้าเรียบร้อยแล้ว'
          : 'เพิ่มสินค้าเรียบร้อยแล้ว'
      );

      await loadProducts();
    } catch (error: any) {
      console.log(
        'SAVE PRODUCT ERROR:',
        error
      );

      showAlert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถบันทึกสินค้าได้'
      );
    }
  };

  // ============================================================
  // DELETE PRODUCT
  // ============================================================

  const deleteProduct = async (
    product: Product
  ) => {
    const confirmDelete =
      Platform.OS === 'web'
        ? window.confirm(
            `ต้องการลบ "${product.name}" หรือไม่?`
          )
        : true;

    if (!confirmDelete) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/products/${product.id}`,
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

      if (
        selectedProduct?.id ===
        product.id
      ) {
        setShowDetail(false);
        setSelectedProduct(null);
      }

      showAlert(
        'ลบสินค้าแล้ว',
        `${product.name} ถูกลบออกจากระบบแล้ว`
      );

      await loadProducts();
    } catch (error: any) {
      console.log(
        'DELETE PRODUCT ERROR:',
        error
      );

      showAlert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถลบสินค้าได้'
      );
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

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
            color="#695CFF"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading products...
          </Text>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <View style={styles.container}>
      <SpaceBackground />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* ======================================================
            HEADER
            ====================================================== */}

        <View style={styles.header}>
          <View>
            <Text
              style={
                styles.smallTitle
              }
            >
              STORE
            </Text>

            <Text
              style={
                styles.headerTitle
              }
            >
              Products
            </Text>

            <Text
              style={
                styles.headerSubtitle
              }
            >
              Choose your IT products
            </Text>
          </View>

          {isAdmin && (
            <TouchableOpacity
              style={
                styles.addButton
              }
              onPress={openAdd}
            >
              <MaterialCommunityIcons
                name="plus"
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.addButtonText
                }
              >
                Add
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ======================================================
            SEARCH
            ====================================================== */}

        <View
          style={
            styles.searchRow
          }
        >
          <View
            style={
              styles.searchBox
            }
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color="#777B85"
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search products..."
              placeholderTextColor="#555862"
              style={
                styles.searchInput
              }
            />
          </View>

          <View
            style={
              styles.countBox
            }
          >
            <Text
              style={
                styles.countLabel
              }
            >
              PRODUCTS
            </Text>

            <Text
              style={
                styles.countNumber
              }
            >
              {filteredProducts.length}
            </Text>
          </View>
        </View>

        {/* ======================================================
            PRODUCT GRID
            ====================================================== */}

        <View
          style={
            styles.productGrid
          }
        >
          {filteredProducts.map(
            (product) => {
              const imageUrl =
                getImageUrl(
                  product.image
                );

              return (
                <Pressable
                  key={product.id}
                  style={
                    styles.productCard
                  }
                  onPress={() =>
                    openDetail(
                      product
                    )
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
                      <MaterialCommunityIcons
                        name="image-off-outline"
                        size={38}
                        color="#555862"
                      />
                    )}
                  </View>

                  {/* NAME */}

                  <Text
                    style={
                      styles.productName
                    }
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>

                  {/* BRAND */}

                  <Text
                    style={
                      styles.productBrand
                    }
                    numberOfLines={1}
                  >
                    {product.brand ||
                      'Unknown Brand'}
                  </Text>

                  {/* PRICE */}

                  <Text
                    style={
                      styles.priceText
                    }
                  >
                    ฿
                    {Number(
                      product.selling_price ||
                        0
                    ).toLocaleString()}
                  </Text>

                  {/* STOCK */}

                  <View
                    style={
                      styles.stockRow
                    }
                  >
                    <Text
                      style={
                        styles.stockLabel
                      }
                    >
                      Stock
                    </Text>

                    <View
                      style={[
                        styles.stockBadge,
                        Number(
                          product.stock
                        ) <= 0 &&
                          styles.stockEmpty,
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

                  {/* USER BUY */}

                  {!isAdmin && (
                    <TouchableOpacity
                      style={[
                        styles.buyButton,
                        Number(
                          product.stock
                        ) <= 0 &&
                          styles.buyButtonDisabled,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        addToCart(
                          product
                        );
                      }}
                      disabled={
                        Number(
                          product.stock
                        ) <= 0
                      }
                    >
                      <MaterialCommunityIcons
                        name="cart-plus"
                        size={17}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.buyButtonText
                        }
                      >
                        {Number(
                          product.stock
                        ) <= 0
                          ? 'Out'
                          : 'Buy'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* ADMIN BUTTONS */}

                  {isAdmin && (
                    <View
                      style={
                        styles.adminButtons
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.editButton
                        }
                        onPress={(event) => {
                          event.stopPropagation();
                          openEdit(
                            product
                          );
                        }}
                      >
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={15}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.buttonText
                          }
                        >
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.deleteButton
                        }
                        onPress={(event) => {
                          event.stopPropagation();
                          deleteProduct(
                            product
                          );
                        }}
                      >
                        <MaterialCommunityIcons
                          name="delete-outline"
                          size={15}
                          color="#FF6B81"
                        />

                        <Text
                          style={
                            styles.deleteText
                          }
                        >
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* VIEW */}

                  <View
                    style={
                      styles.viewHint
                    }
                  >
                    <Text
                      style={
                        styles.viewHintText
                      }
                    >
                      Tap to view
                    </Text>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={15}
                      color="#777B85"
                    />
                  </View>
                </Pressable>
              );
            }
          )}
        </View>

        {/* EMPTY */}

        {filteredProducts.length ===
          0 && (
          <View
            style={
              styles.emptyContainer
            }
          >
            <MaterialCommunityIcons
              name="package-variant"
              size={55}
              color="#4A4C55"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No products found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Try another search
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ========================================================
          PRODUCT DETAIL MODAL
          ======================================================== */}

      <Modal
        visible={showDetail}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowDetail(false)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.detailModal
            }
          >
            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={() =>
                setShowDetail(false)
              }
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {selectedProduct && (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.detailContent
                }
              >
                <View
                  style={
                    styles.detailImageBox
                  }
                >
                  {getImageUrl(
                    selectedProduct.image
                  ) ? (
                    <Image
                      source={{
                        uri:
                          getImageUrl(
                            selectedProduct.image
                          ) as string,
                      }}
                      style={
                        styles.detailImage
                      }
                      resizeMode="contain"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="image-off-outline"
                      size={60}
                      color="#555862"
                    />
                  )}
                </View>

                <Text
                  style={
                    styles.detailTitle
                  }
                >
                  {
                    selectedProduct.name
                  }
                </Text>

                <Text
                  style={
                    styles.detailBrand
                  }
                >
                  {selectedProduct.brand ||
                    'Unknown Brand'}
                </Text>

                <Text
                  style={
                    styles.detailPrice
                  }
                >
                  ฿
                  {Number(
                    selectedProduct.selling_price ||
                      0
                  ).toLocaleString()}
                </Text>

                <View
                  style={
                    styles.detailGrid
                  }
                >
                  <DetailItem
                    label="Stock"
                    value={String(
                      selectedProduct.stock
                    )}
                  />

                  <DetailItem
                    label="Category"
                    value={
                      selectedProduct.category ||
                      '-'
                    }
                  />

                  <DetailItem
                    label="VRAM"
                    value={
                      selectedProduct.vram
                        ? String(
                            selectedProduct.vram
                          )
                        : '-'
                    }
                  />

                  <DetailItem
                    label="Serial Number"
                    value={
                      selectedProduct.serial_number ||
                      '-'
                    }
                  />

                  {isAdmin && (
                    <DetailItem
                      label="Cost Price"
                      value={`฿${Number(
                        selectedProduct.cost_price ||
                          0
                      ).toLocaleString()}`}
                    />
                  )}
                </View>

                {!isAdmin && (
                  <TouchableOpacity
                    style={[
                      styles.detailBuyButton,
                      Number(
                        selectedProduct.stock
                      ) <= 0 &&
                        styles.buyButtonDisabled,
                    ]}
                    onPress={() =>
                      addToCart(
                        selectedProduct
                      )
                    }
                    disabled={
                      Number(
                        selectedProduct.stock
                      ) <= 0
                    }
                  >
                    <MaterialCommunityIcons
                      name="cart-plus"
                      size={20}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.detailBuyText
                      }
                    >
                      {Number(
                        selectedProduct.stock
                      ) <= 0
                        ? 'สินค้าหมด'
                        : 'เพิ่มลงตะกร้า'}
                    </Text>
                  </TouchableOpacity>
                )}

                {isAdmin && (
                  <View
                    style={
                      styles.detailAdminRow
                    }
                  >
                    <TouchableOpacity
                      style={
                        styles.detailEditButton
                      }
                      onPress={() => {
                        setShowDetail(
                          false
                        );
                        openEdit(
                          selectedProduct
                        );
                      }}
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={19}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.detailButtonText
                        }
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.detailDeleteButton
                      }
                      onPress={() =>
                        deleteProduct(
                          selectedProduct
                        )
                      }
                    >
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={19}
                        color="#FF6B81"
                      />

                      <Text
                        style={
                          styles.detailDeleteText
                        }
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================
          ADD / EDIT MODAL
          ======================================================== */}

      <Modal
        visible={showForm}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowForm(false)
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
            <View
              style={
                styles.formHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.formTitle
                  }
                >
                  {editingProduct
                    ? 'Edit Product'
                    : 'Add Product'}
                </Text>

                <Text
                  style={
                    styles.formSubtitle
                  }
                >
                  Product information
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.closeButton
                }
                onPress={() =>
                  setShowForm(false)
                }
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.formContent
              }
            >
              <FormInput
                label="Product Name"
                value={form.name}
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    name: value,
                  })
                }
              />

              <View
                style={
                  styles.formTwoColumns
                }
              >
                <View
                  style={
                    styles.formHalf
                  }
                >
                  <FormInput
                    label="Stock"
                    value={form.stock}
                    onChangeText={(value) =>
                      setForm({
                        ...form,
                        stock: value,
                      })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View
                  style={
                    styles.formHalf
                  }
                >
                  <FormInput
                    label="Category"
                    value={
                      form.category
                    }
                    onChangeText={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        category:
                          value,
                      })
                    }
                  />
                </View>
              </View>

              <View
                style={
                  styles.formTwoColumns
                }
              >
                <View
                  style={
                    styles.formHalf
                  }
                >
                  <FormInput
                    label="Brand"
                    value={form.brand}
                    onChangeText={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        brand: value,
                      })
                    }
                  />
                </View>

                <View
                  style={
                    styles.formHalf
                  }
                >
                  <FormInput
                    label="VRAM"
                    value={form.vram}
                    onChangeText={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        vram: value,
                      })
                    }
                  />
                </View>
              </View>

              <FormInput
                label="Serial Number"
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
              />

              <FormInput
                label="Image URL"
                value={form.image}
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    image: value,
                  })
                }
              />

              <View
                style={
                  styles.formTwoColumns
                }
              >
                <View
                  style={
                    styles.formHalf
                  }
                >
                  <FormInput
                    label="Cost Price"
                    value={
                      form.cost_price
                    }
                    onChangeText={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        cost_price:
                          value,
                      })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View
                  style={
                    styles.formHalf
                  }
                >
                  <FormInput
                    label="Selling Price"
                    value={
                      form.selling_price
                    }
                    onChangeText={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        selling_price:
                          value,
                      })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={
                  styles.saveButton
                }
                onPress={
                  saveProduct
                }
              >
                <MaterialCommunityIcons
                  name="content-save-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {editingProduct
                    ? 'Save Changes'
                    : 'Add Product'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================
          CUSTOM ALERT
          ======================================================== */}

      <Modal
        visible={alertInfo.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setAlertInfo({
            ...alertInfo,
            visible: false,
          })
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
              style={
                styles.alertIcon
              }
            >
              <MaterialCommunityIcons
                name="check"
                size={24}
                color="#FFFFFF"
              />
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
              style={
                styles.alertButton
              }
              onPress={() =>
                setAlertInfo({
                  ...alertInfo,
                  visible: false,
                })
              }
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

// ============================================================
// DETAIL ITEM
// ============================================================

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.detailItem
      }
    >
      <Text
        style={
          styles.detailItemLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.detailItemValue
        }
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ============================================================
// FORM INPUT
// ============================================================

function FormInput({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  keyboardType?: any;
}) {
  return (
    <View
      style={
        styles.formInputGroup
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
        value={value}
        onChangeText={
          onChangeText
        }
        keyboardType={
          keyboardType
        }
        placeholderTextColor="#555862"
        style={
          styles.formInput
        }
      />
    </View>
  );
}

// ============================================================
// SPACE BACKGROUND
// ============================================================

function SpaceBackground() {
  const stars = [
    { left: '8%', top: '10%' },
    { left: '22%', top: '17%' },
    { left: '38%', top: '8%' },
    { left: '55%', top: '14%' },
    { left: '72%', top: '9%' },
    { left: '88%', top: '20%' },
    { left: '13%', top: '38%' },
    { left: '30%', top: '48%' },
    { left: '78%', top: '42%' },
    { left: '92%', top: '58%' },
    { left: '18%', top: '72%' },
    { left: '50%', top: '82%' },
    { left: '84%', top: '78%' },
  ];

  return (
    <View
      pointerEvents="none"
      style={
        StyleSheet.absoluteFillObject
      }
    >
      <View
        style={
          styles.spaceGlow
        }
      />

      <View
        style={
          styles.spaceGlowPurple
        }
      />

      {stars.map(
        (star, index) => (
          <View
            key={index}
            style={[
              styles.spaceStar,
              {
                left:
                  star.left,
                top: star.top,
              },
            ]}
          />
        )
      )}

      <View
        style={[
          styles.spaceMeteor,
          {
            left:
              SCREEN_WIDTH *
              0.78,
            top:
              SCREEN_HEIGHT *
              0.17,
          },
        ]}
      >
        <View
          style={
            styles.spaceMeteorLong
          }
        />
        <View
          style={
            styles.spaceMeteorShort
          }
        />
        <View
          style={
            styles.spaceMeteorPoint
          }
        />
      </View>

      <View
        style={[
          styles.spaceMeteor,
          {
            left:
              SCREEN_WIDTH *
              0.22,
            top:
              SCREEN_HEIGHT *
              0.32,
          },
        ]}
      >
        <View
          style={
            styles.spaceMeteorLong
          }
        />
        <View
          style={
            styles.spaceMeteorShort
          }
        />
        <View
          style={
            styles.spaceMeteorPoint
          }
        />
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050507',
    overflow: 'hidden',
  },

  scrollContent: {
    paddingTop: 35,
    paddingBottom: 100,
    paddingHorizontal:
      SCREEN_WIDTH < 500 ? 12 : 28,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  smallTitle: {
    color: '#777B85',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize:
      SCREEN_WIDTH < 500
        ? 27
        : 34,
    fontWeight: '800',
    marginTop: 3,
  },

  headerSubtitle: {
    color: '#666A73',
    fontSize: 12,
    marginTop: 4,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor:
      'rgba(91,78,255,0.22)',
    borderWidth: 1,
    borderColor:
      'rgba(110,100,255,0.7)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ==========================================================
  // SEARCH
  // ==========================================================

  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },

  searchBox: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    backgroundColor:
      'rgba(8,8,15,0.75)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    borderRadius: 12,
  },

  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
    outlineStyle: 'none',
  },

  countBox: {
    width:
      SCREEN_WIDTH < 500
        ? 72
        : 90,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(8,8,15,0.75)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  countLabel: {
    color: '#555862',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  countNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },

  // ==========================================================
  // GRID
  // ==========================================================

  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    gap: 12,
  },

  productCard: {
    width:
      SCREEN_WIDTH < 500
        ? '48.2%'
        : '31.8%',
    backgroundColor:
      'rgba(8,8,15,0.78)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    borderRadius: 15,
    padding: 10,
    marginBottom: 2,
  },

  imageBox: {
    width: '100%',
    height:
      SCREEN_WIDTH < 500
        ? 115
        : 160,
    borderRadius: 11,
    backgroundColor:
      'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },

  productImage: {
    width: '92%',
    height: '92%',
  },

  productName: {
    color: '#FFFFFF',
    fontSize:
      SCREEN_WIDTH < 500
        ? 12
        : 14,
    fontWeight: '700',
    lineHeight:
      SCREEN_WIDTH < 500
        ? 17
        : 20,
    minHeight:
      SCREEN_WIDTH < 500
        ? 34
        : 40,
  },

  productBrand: {
    color: '#777B85',
    fontSize: 9,
    marginTop: 4,
  },

  priceText: {
    color: '#B0A6FF',
    fontSize:
      SCREEN_WIDTH < 500
        ? 15
        : 18,
    fontWeight: '800',
    marginTop: 7,
  },

  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginTop: 8,
  },

  stockLabel: {
    color: '#555862',
    fontSize: 9,
  },

  stockBadge: {
    minWidth: 31,
    height: 23,
    paddingHorizontal: 7,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(0,180,100,0.12)',
    borderWidth: 1,
    borderColor:
      'rgba(0,220,140,0.2)',
  },

  stockEmpty: {
    backgroundColor:
      'rgba(255,60,90,0.12)',
    borderColor:
      'rgba(255,60,90,0.25)',
  },

  stockText: {
    color: '#62DDA5',
    fontSize: 9,
    fontWeight: '700',
  },

  // ==========================================================
  // BUY
  // ==========================================================

  buyButton: {
    height: 34,
    marginTop: 9,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#5D51F5',
  },

  buyButtonDisabled: {
    opacity: 0.35,
  },

  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // ==========================================================
  // ADMIN
  // ==========================================================

  adminButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 9,
  },

  editButton: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    backgroundColor:
      'rgba(91,78,255,0.2)',
    borderWidth: 1,
    borderColor:
      'rgba(110,100,255,0.45)',
  },

  deleteButton: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    backgroundColor:
      'rgba(255,50,80,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,70,90,0.25)',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  deleteText: {
    color: '#FF6B81',
    fontSize: 9,
    fontWeight: '700',
  },

  // ==========================================================
  // VIEW HINT
  // ==========================================================

  viewHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 7,
  },

  viewHintText: {
    color: '#555862',
    fontSize: 8,
  },

  // ==========================================================
  // EMPTY
  // ==========================================================

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 15,
  },

  emptyText: {
    color: '#555862',
    fontSize: 12,
    marginTop: 5,
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#777B85',
    fontSize: 12,
    marginTop: 12,
  },

  // ==========================================================
  // DETAIL MODAL
  // ==========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  detailModal: {
    width: '100%',
    maxWidth: 470,
    maxHeight:
      SCREEN_HEIGHT * 0.88,
    backgroundColor: '#0D0D14',
    borderRadius: 20,
    borderWidth: 1,
    borderColor:
      'rgba(110,100,255,0.45)',
    overflow: 'hidden',
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.06)',
  },

  detailContent: {
    padding: 20,
    paddingTop: 14,
  },

  detailImageBox: {
    width: '100%',
    height:
      SCREEN_WIDTH < 500
        ? 190
        : 250,
    borderRadius: 15,
    backgroundColor:
      'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  detailImage: {
    width: '92%',
    height: '92%',
  },

  detailTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 18,
    lineHeight: 25,
  },

  detailBrand: {
    color: '#777B85',
    fontSize: 12,
    marginTop: 4,
  },

  detailPrice: {
    color: '#B0A6FF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 12,
  },

  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    marginTop: 18,
  },

  detailItem: {
    width: '48%',
    minHeight: 62,
    backgroundColor:
      'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },

  detailItemLabel: {
    color: '#555862',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  detailItemValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },

  detailBuyButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#5D51F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
  },

  detailBuyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  detailAdminRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },

  detailEditButton: {
    flex: 1,
    height: 46,
    borderRadius: 11,
    backgroundColor:
      'rgba(91,78,255,0.22)',
    borderWidth: 1,
    borderColor:
      'rgba(110,100,255,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  detailDeleteButton: {
    flex: 1,
    height: 46,
    borderRadius: 11,
    backgroundColor:
      'rgba(255,50,80,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,70,90,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  detailDeleteText: {
    color: '#FF6B81',
    fontSize: 13,
    fontWeight: '700',
  },

  // ==========================================================
  // FORM MODAL
  // ==========================================================

  formModal: {
    width: '100%',
    maxWidth: 560,
    maxHeight:
      SCREEN_HEIGHT * 0.9,
    backgroundColor: '#0D0D14',
    borderRadius: 20,
    borderWidth: 1,
    borderColor:
      'rgba(110,100,255,0.45)',
    overflow: 'hidden',
  },

  formHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    padding: 18,
    paddingBottom: 8,
  },

  formTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  formSubtitle: {
    color: '#666A73',
    fontSize: 10,
    marginTop: 3,
  },

  formContent: {
    padding: 18,
    paddingTop: 8,
    paddingBottom: 25,
  },

  formInputGroup: {
    marginBottom: 12,
  },

  formLabel: {
    color: '#777B85',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  formInput: {
    height: 43,
    backgroundColor:
      'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.09)',
    borderRadius: 9,
    paddingHorizontal: 11,
    color: '#FFFFFF',
    fontSize: 12,
    outlineStyle: 'none',
  },

  formTwoColumns: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    gap: 10,
  },

  formHalf: {
    flex: 1,
  },

  saveButton: {
    height: 48,
    borderRadius: 11,
    backgroundColor: '#5D51F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 7,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // ==========================================================
  // ALERT
  // ==========================================================

  alertOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  alertCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#111119',
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      'rgba(110,100,255,0.45)',
    padding: 22,
    alignItems: 'center',
  },

  alertIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#5D51F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  alertTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },

  alertMessage: {
    color: '#999CA6',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },

  alertButton: {
    width: '100%',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#5D51F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ==========================================================
  // SPACE BACKGROUND
  // ==========================================================

  spaceGlow: {
    position: 'absolute',
    width: 650,
    height: 650,
    borderRadius: 325,
    left: '50%',
    top: '42%',
    marginLeft: -325,
    marginTop: -325,
    backgroundColor:
      'rgba(55,45,150,0.045)',
    shadowColor: '#675BFF',
    shadowOpacity: 0.15,
    shadowRadius: 100,
  },

  spaceGlowPurple: {
    position: 'absolute',
    width: 430,
    height: 430,
    borderRadius: 215,
    left: '50%',
    top: '40%',
    marginLeft: -215,
    marginTop: -215,
    backgroundColor:
      'rgba(95,70,255,0.025)',
    shadowColor: '#675BFF',
    shadowOpacity: 0.2,
    shadowRadius: 80,
  },

  spaceStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFD66B',
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },

  spaceMeteor: {
    position: 'absolute',
    width: 4,
    height: 4,
    transform: [
      {
        rotate: '-45deg',
      },
    ],
  },

  spaceMeteorLong: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 90,
    height: 1,
    backgroundColor:
      'rgba(255,215,130,0.13)',
  },

  spaceMeteorShort: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 35,
    height: 1,
    backgroundColor:
      'rgba(255,240,190,0.5)',
  },

  spaceMeteorPoint: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 1,
    shadowRadius: 5,
  },
});