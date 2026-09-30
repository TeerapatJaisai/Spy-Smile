import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

const API_BASE_URL =
  'http://119.59.102.161:3100/api';

export default function ProfileScreen() {
  const [username, setUsername] = useState('User');
  const [role, setRole] = useState('user');
  const [userId, setUserId] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState(
    'https://cdn-icons-png.flaticon.com/512/149/149071.png'
  );

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalType, setModalType] = useState<
    'avatar' | 'address' | null
  >(null);

  const [inputValue, setInputValue] = useState('');

  const [alertInfo, setAlertInfo] = useState<{
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

  const fetchData = async () => {
    try {
      setLoading(true);

      const savedName =
        Platform.OS === 'web'
          ? window.localStorage.getItem('username')
          : null;

      const savedId =
        Platform.OS === 'web'
          ? window.localStorage.getItem('userId')
          : null;

      if (!savedName || !savedId) {
        router.replace('/login');
        return;
      }

      setUsername(savedName);
      setUserId(savedId);

      const userRes = await fetch(
        `${API_BASE_URL}/users/${savedName}`
      );

      if (userRes.ok) {
        const userData =
          await userRes.json();

        setRole(userData.role);

        if (userData.avatar_url) {
          setAvatarUrl(userData.avatar_url);
        }
      }

      const addressRes = await fetch(
        `${API_BASE_URL}/addresses/${savedId}`
      );

      if (addressRes.ok) {
        setAddresses(
          await addressRes.json()
        );
      }
    } catch (err) {
      console.log('PROFILE ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleSaveModal = async () => {
    if (!inputValue.trim()) {
      setModalType(null);
      return;
    }

    try {
      if (modalType === 'avatar') {
        const res = await fetch(
          `${API_BASE_URL}/users/${username}/avatar`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              avatar_url: inputValue,
            }),
          }
        );

        if (res.ok) {
          setAvatarUrl(inputValue);

          showAlert(
            'อัปเดตโปรไฟล์',
            'เปลี่ยนรูปโปรไฟล์สำเร็จแล้ว'
          );
        }
      }

      if (
        modalType === 'address' &&
        userId
      ) {
        const res = await fetch(
          `${API_BASE_URL}/addresses`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId,
              address_text: inputValue,
              is_default:
                addresses.length === 0,
            }),
          }
        );

        if (res.ok) {
          await fetchData();

          showAlert(
            'เพิ่มที่อยู่สำเร็จ',
            'ข้อมูลที่อยู่ของคุณถูกบันทึกแล้ว'
          );
        }
      }
    } catch (err) {
      console.log(
        'SAVE PROFILE ERROR:',
        err
      );
    } finally {
      setModalType(null);
      setInputValue('');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      window.localStorage.clear();
    }

    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SpaceBackground />

        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#6C63FF"
          />

          <Text style={styles.loadingText}>
            กำลังโหลดข้อมูล...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SpaceBackground />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#050507"
        />

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            ข้อมูลส่วนตัว
          </Text>

          <Text style={styles.headerSubtitle}>
            จัดการข้อมูลบัญชีของคุณ
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* PROFILE */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: avatarUrl,
                }}
                style={styles.avatar}
              />
            </View>

            <View style={styles.userInfo}>
              <Text
                style={styles.username}
                numberOfLines={1}
              >
                {username}
              </Text>

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      role === 'admin'
                        ? 'rgba(239,68,68,0.15)'
                        : 'rgba(59,130,246,0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    {
                      color:
                        role === 'admin'
                          ? '#FF6B6B'
                          : '#60A5FA',
                    },
                  ]}
                >
                  {role === 'admin'
                    ? 'ผู้ดูแลระบบ'
                    : 'ลูกค้าสมาชิก'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => {
                setInputValue(avatarUrl);
                setModalType('avatar');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={styles.editProfileText}
              >
                แก้ไขรูป
              </Text>
            </TouchableOpacity>
          </View>

          {/* ADDRESS */}
          <View style={styles.section}>
            <View
              style={styles.sectionHeader}
            >
              <Text
                style={styles.sectionTitle}
              >
                ที่อยู่จัดส่ง
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setInputValue('');
                  setModalType('address');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={styles.addAddressText}
                >
                  + เพิ่มที่อยู่
                </Text>
              </TouchableOpacity>
            </View>

            {addresses.length === 0 ? (
              <View
                style={styles.emptyAddress}
              >
                <Text
                  style={styles.emptyAddressIcon}
                >
                  📍
                </Text>

                <Text
                  style={styles.emptyAddressText}
                >
                  ยังไม่มีข้อมูลที่อยู่
                </Text>
              </View>
            ) : (
              addresses.map((addr) => (
                <View
                  key={addr.id}
                  style={styles.addressCard}
                >
                  <View
                    style={styles.addressTop}
                  >
                    <Text
                      style={
                        styles.addressNumber
                      }
                    >
                      📍 ที่อยู่
                    </Text>

                    {addr.is_default && (
                      <View
                        style={
                          styles.defaultBadge
                        }
                      >
                        <Text
                          style={
                            styles.defaultBadgeText
                          }
                        >
                          ค่าเริ่มต้น
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={styles.addressText}
                  >
                    {addr.address_text}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* ACCOUNT INFO */}
          <View style={styles.infoSection}>
            <Text
              style={styles.infoTitle}
            >
              ข้อมูลบัญชี
            </Text>

            <View style={styles.infoRow}>
              <Text
                style={styles.infoLabel}
              >
                Username
              </Text>

              <Text
                style={styles.infoValue}
                numberOfLines={1}
              >
                {username}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text
                style={styles.infoLabel}
              >
                Account Type
              </Text>

              <Text
                style={styles.infoValue}
              >
                {role === 'admin'
                  ? 'Administrator'
                  : 'Customer'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text
            style={styles.logoutIcon}
          >
            ↪
          </Text>

          <Text
            style={styles.logoutBtnText}
          >
            ออกจากระบบ
          </Text>
        </TouchableOpacity>

        {/* EDIT MODAL */}
        {modalType && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text
                style={styles.modalTitle}
              >
                {modalType === 'avatar'
                  ? 'อัปเดตอวตาร'
                  : 'เพิ่มที่อยู่ใหม่'}
              </Text>

              <TextInput
                style={[
                  styles.modalInput,
                  modalType ===
                    'address' && {
                    height: 110,
                    textAlignVertical:
                      'top',
                  },
                ]}
                value={inputValue}
                onChangeText={
                  setInputValue
                }
                placeholder={
                  modalType === 'avatar'
                    ? 'วางลิงก์รูปภาพ...'
                    : 'กรอกรายละเอียดที่อยู่...'
                }
                placeholderTextColor="#777B85"
                multiline={
                  modalType === 'address'
                }
                autoCapitalize="none"
              />

              <View
                style={styles.modalActions}
              >
                <TouchableOpacity
                  style={
                    styles.modalCancelBtn
                  }
                  onPress={() => {
                    setModalType(null);
                    setInputValue('');
                  }}
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
                  style={
                    styles.modalConfirmBtn
                  }
                  onPress={
                    handleSaveModal
                  }
                >
                  <Text
                    style={
                      styles.modalConfirmText
                    }
                  >
                    บันทึก
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* CUSTOM ALERT */}
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
              <View
                style={
                  styles.alertIconCircle
                }
              >
                <Text
                  style={
                    styles.alertIcon
                  }
                >
                  ✓
                </Text>
              </View>

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
                    visible: false,
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

/* =========================================================
   SPACE BACKGROUND
========================================================= */

function SpaceBackground() {
  return (
    <View
      pointerEvents="none"
      style={styles.background}
    >
      {/* Main purple glow */}
      <View
        style={styles.backgroundGlow}
      />

      {/* Blue glow */}
      <View
        style={styles.backgroundGlowBlue}
      />

      {/* Stars */}
      <View
        style={[
          styles.star,
          {
            left: '8%',
            top: '12%',
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: '18%',
            top: '27%',
          },
        ]}
      />

      <View
        style={[
          styles.starSmall,
          {
            left: '32%',
            top: '9%',
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: '46%',
            top: '19%',
          },
        ]}
      />

      <View
        style={[
          styles.starSmall,
          {
            left: '63%',
            top: '11%',
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: '78%',
            top: '23%',
          },
        ]}
      />

      <View
        style={[
          styles.starSmall,
          {
            left: '91%',
            top: '10%',
          },
        ]}
      />

      <View
        style={[
          styles.starSmall,
          {
            left: '12%',
            top: '55%',
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: '27%',
            top: '68%',
          },
        ]}
      />

      <View
        style={[
          styles.starSmall,
          {
            left: '54%',
            top: '57%',
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: '72%',
            top: '72%',
          },
        ]}
      />

      <View
        style={[
          styles.starSmall,
          {
            left: '88%',
            top: '58%',
          },
        ]}
      />

      <View
        style={[
          styles.starSmall,
          {
            left: '38%',
            top: '88%',
          },
        ]}
      />

      <View
        style={[
          styles.star,
          {
            left: '82%',
            top: '90%',
          },
        ]}
      />

      {/* Thin meteors - static */}
      <View
        style={[
          styles.meteor,
          {
            left: '88%',
            top: '12%',
          },
        ]}
      >
        <View
          style={styles.meteorLong}
        />
        <View
          style={styles.meteorBright}
        />
        <View
          style={styles.meteorPoint}
        />
      </View>

      <View
        style={[
          styles.meteor,
          {
            left: '70%',
            top: '30%',
          },
        ]}
      >
        <View
          style={styles.meteorLong}
        />
        <View
          style={styles.meteorBright}
        />
        <View
          style={styles.meteorPoint}
        />
      </View>

      <View
        style={[
          styles.meteor,
          {
            left: '92%',
            top: '42%',
          },
        ]}
      >
        <View
          style={styles.meteorMid}
        />
        <View
          style={styles.meteorBright}
        />
        <View
          style={styles.meteorPoint}
        />
      </View>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
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

  backgroundGlow: {
    position: 'absolute',
    width: 430,
    height: 430,
    borderRadius: 215,
    left: -170,
    top: 80,
    backgroundColor:
      'rgba(65,45,180,0.10)',
  },

  backgroundGlowBlue: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    right: -150,
    bottom: 30,
    backgroundColor:
      'rgba(35,80,180,0.08)',
  },

  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor:
      'rgba(255,255,255,0.65)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },

  starSmall: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor:
      'rgba(255,255,255,0.4)',
  },

  meteor: {
    position: 'absolute',
    width: 4,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  meteorLong: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 100,
    height: 1,
    borderRadius: 10,
    backgroundColor:
      'rgba(255,215,130,0.16)',
  },

  meteorMid: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 65,
    height: 1,
    borderRadius: 10,
    backgroundColor:
      'rgba(255,230,175,0.35)',
  },

  meteorBright: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 28,
    height: 1,
    borderRadius: 10,
    backgroundColor: '#FFF8E8',
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

  header: {
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === 'web'
        ? 28
        : 15,
    paddingBottom: 15,
    backgroundColor:
      'rgba(5,5,7,0.88)',
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.08)',
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#777B85',
  },

  scrollContent: {
    paddingBottom: 30,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#777B85',
    fontSize: 13,
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(15,15,22,0.92)',
    padding: 18,
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  avatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 2,
    backgroundColor:
      'rgba(100,90,255,0.35)',
  },

  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#111218',
  },

  userInfo: {
    flex: 1,
    marginLeft: 15,
  },

  username: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 7,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  roleText: {
    fontSize: 11,
    fontWeight: '800',
  },

  editProfileBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  editProfileText: {
    fontSize: 12,
    color: '#8178FF',
    fontWeight: '800',
  },

  section: {
    marginTop: 26,
    marginHorizontal: 16,
    paddingBottom: 10,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  addAddressText: {
    color: '#8178FF',
    fontWeight: '800',
    fontSize: 13,
  },

  emptyAddress: {
    backgroundColor:
      'rgba(15,15,22,0.9)',
    padding: 25,
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
    borderStyle: 'dashed',
  },

  emptyAddressIcon: {
    fontSize: 28,
    marginBottom: 8,
  },

  emptyAddressText: {
    color: '#777B85',
    fontSize: 13,
    fontWeight: '600',
  },

  addressCard: {
    backgroundColor:
      'rgba(15,15,22,0.92)',
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
    marginBottom: 10,
  },

  addressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },

  addressNumber: {
    color: '#A9A4FF',
    fontSize: 12,
    fontWeight: '800',
  },

  addressText: {
    color: '#B4B7C0',
    fontSize: 13,
    lineHeight: 21,
  },

  defaultBadge: {
    backgroundColor:
      'rgba(92,80,255,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor:
      'rgba(110,100,255,0.35)',
  },

  defaultBadgeText: {
    color: '#958EFF',
    fontSize: 10,
    fontWeight: '800',
  },

  infoSection: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor:
      'rgba(15,15,22,0.88)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 15,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoLabel: {
    color: '#777B85',
    fontSize: 12,
  },

  infoValue: {
    color: '#D8D9DF',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '60%',
  },

  infoDivider: {
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.07)',
    marginVertical: 13,
  },

  logoutBtn: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor:
      'rgba(239,68,68,0.10)',
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      'rgba(239,68,68,0.22)',
  },

  logoutIcon: {
    color: '#FF6B6B',
    fontSize: 18,
    marginRight: 7,
  },

  logoutBtnText: {
    color: '#FF6B6B',
    fontWeight: '800',
    fontSize: 14,
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: 20,
  },

  modalCard: {
    backgroundColor: '#111118',
    width: '100%',
    maxWidth: 360,
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 18,
    textAlign: 'center',
  },

  modalInput: {
    backgroundColor: '#09090D',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
    padding: 14,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 18,
    borderRadius: 12,
    outlineStyle: 'none',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },

  modalCancelBtn: {
    flex: 1,
    padding: 13,
    backgroundColor:
      'rgba(255,255,255,0.06)',
    borderRadius: 11,
    alignItems: 'center',
  },

  modalCancelText: {
    color: '#A4A7B0',
    fontWeight: '700',
  },

  modalConfirmBtn: {
    flex: 1,
    padding: 13,
    backgroundColor: '#6258FF',
    borderRadius: 11,
    alignItems: 'center',
  },

  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  customModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },

  customModalCard: {
    backgroundColor: '#111118',
    width: '85%',
    maxWidth: 320,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
  },

  alertIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      'rgba(92,80,255,0.18)',
    borderWidth: 1,
    borderColor:
      'rgba(110,100,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  alertIcon: {
    color: '#9189FF',
    fontSize: 24,
    fontWeight: '900',
  },

  customModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },

  customModalMessage: {
    fontSize: 14,
    color: '#A4A7B0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },

  customModalBtn: {
    backgroundColor: '#6258FF',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  customModalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});