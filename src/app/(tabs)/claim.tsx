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
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';

// นำเข้าเฉพาะไลบรารีสำหรับการพิมพ์ PDF (เอา ImagePicker ออกแล้ว)
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const BASE_URL = 'http://119.59.102.161:3100';
const API_BASE_URL = `${BASE_URL}/api`;

const { width, height } = Dimensions.get('window');

type ClaimableItem = {
  order_item_id: number;
  product_name: string;
  quantity: number;
  order_id: number;
  created_at: string;
};

type Claim = {
  id: number;
  product_name: string;
  reason: string;
  stage_name: string;
  stage_order: number;
  created_at: string;
};

type ClaimDetail = Claim & {
  description: string;
  allStages: {
    id: number;
    name: string;
    step_order: number;
  }[];
  currentStage: {
    step_order: number;
  };
};

const REASONS = [
  'จอไม่แสดงผล / ไม่ติด',
  'พัดลมมีเสียงดัง',
  'เครื่องรีสตาร์ทเอง',
  'อื่นๆ',
];

export default function ClaimScreen() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimableItems, setClaimableItems] = useState<ClaimableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ClaimableItem | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ClaimDetail | null>(null);

  const userId = Platform.OS === 'web' ? window.localStorage.getItem('userId') : null;

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchAll = async () => {
    if (!userId) {
      router.replace('/login');
      return;
    }

    try {
      setLoading(true);
      const [claimsRes, itemsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/claims/${userId}`),
        fetch(`${API_BASE_URL}/orders/${userId}/claimable`),
      ]);

      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setClaims(claimsData);
      }
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setClaimableItems(itemsData);
      }
    } catch (err) {
      console.error('Claim fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  // =====================================================
  // OPEN CLAIM DETAIL
  // =====================================================

  const openDetail = async (claimId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/claims/detail/${claimId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDetail(data);
      }
    } catch (err) {
      console.error('Claim detail error:', err);
    }
  };

  // =====================================================
  // SUBMIT CLAIM
  // =====================================================

  const handleSubmitClaim = async () => {
    if (!selectedItem) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกสินค้าที่ต้องการเคลม');
      return;
    }
    if (!userId) {
      Alert.alert('แจ้งเตือน', 'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_item_id: selectedItem.order_item_id,
          user_id: userId,
          reason,
          description,
        }),
      });

      if (res.ok) {
        setView('list');
        setSelectedItem(null);
        setDescription('');
        setReason(REASONS[0]);

        Alert.alert('สำเร็จ', 'บันทึกข้อมูลการเคลมเรียบร้อยแล้ว');
        await fetchAll();
      } else {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถส่งเรื่องเคลมได้');
      }
    } catch (err) {
      console.error('Submit claim error:', err);
      Alert.alert('เกิดข้อผิดพลาด', 'มีปัญหาการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // GENERATE CLAIM SLIP (PDF) - แบบฟอร์มทางการ (พอดีมือถือ/A4)
  // =====================================================
  
  const generateClaimSlip = async () => {
    if (!selectedDetail) return;
    
    // จัดรูปแบบวันที่แบบไทย
    const claimDate = new Date(selectedDetail.created_at).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>แบบฟอร์มส่งเคลมสินค้า - #${selectedDetail.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
          
          @page { 
            size: A4; 
            margin: 15mm; 
          }
          
          html, body {
            margin: 0;
            padding: 0;
            background-color: #fff;
          }

          /* บังคับความกว้างให้เท่ากับ A4 (210mm) เสมอ เพื่อไม่ให้เพี้ยนตอนกดจากจอมือถือ */
          body { 
            font-family: 'Sarabun', sans-serif; 
            color: #000; 
            line-height: 1.6;
            width: 210mm; 
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
          }

          /* แต่ตอนที่เครื่องพิมพ์ดึงไปปริ้นจริง ให้ปรับให้พอดีกระดาษ 100% */
          @media print {
            body {
              width: 100%;
              padding: 0;
            }
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0 0;
            font-size: 14px;
            color: #555;
          }
          .doc-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 15px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            background-color: #f0f0f0;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-bottom: none;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .section-content {
            border: 1px solid #ccc;
            padding: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 8px 4px;
            vertical-align: top;
            font-size: 15px;
          }
          .label {
            font-weight: bold;
            width: 160px;
            color: #333;
          }
          .footer-note {
            margin-top: 30px;
            font-size: 14px;
            text-align: center;
            font-weight: bold;
            border: 1px dashed #000;
            padding: 12px;
            background-color: #fafafa;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-around;
          }
          .signature-box {
            text-align: center;
            width: 220px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 8px;
            height: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>แบบฟอร์มส่งเคลมสินค้า (Product Claim Form)</h1>
          <p>กรุณาพิมพ์และแนบเอกสารฉบับนี้มาพร้อมกับกล่องพัสดุที่ท่านต้องการส่งเคลม</p>
        </div>

        <div class="doc-info">
          <div><strong>หมายเลขการเคลม (Claim No.):</strong> CLM-${String(selectedDetail.id).padStart(6, '0')}</div>
          <div><strong>วันที่แจ้งเรื่อง (Date):</strong> ${claimDate}</div>
        </div>

        <div class="section">
          <div class="section-title">ข้อมูลสินค้า (Product Information)</div>
          <div class="section-content">
            <table>
              <tr>
                <td class="label">ชื่อสินค้าที่ต้องการเคลม:</td>
                <td>${selectedDetail.product_name}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="section">
          <div class="section-title">รายละเอียดปัญหาที่พบ (Problem Description)</div>
          <div class="section-content">
            <table>
              <tr>
                <td class="label">อาการที่พบ (เหตุผล):</td>
                <td>${selectedDetail.reason}</td>
              </tr>
              <tr>
                <td class="label">รายละเอียดเพิ่มเติม:</td>
                <td>${selectedDetail.description || '-'}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="footer-note">
          ⚠️ กรุณาบรรจุสินค้าใส่กล่องให้เรียบร้อย พร้อมใส่วัสดุกันกระแทกเพื่อป้องกันความเสียหายระหว่างการขนส่ง
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>(ผู้แจ้งเคลมสินค้า)</p>
            <p>วันที่: ______/______/______</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>(เจ้าหน้าที่ผู้รับตรวจสอบ)</p>
            <p>สำหรับเจ้าหน้าที่</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          
          setTimeout(() => {
            printWindow.print();
            printWindow.close(); 
          }, 500);
        } else {
          Alert.alert('แจ้งเตือน', 'เบราว์เซอร์ของคุณบล็อกป๊อปอัป กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้');
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถสร้างใบเคลมได้');
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.container}>
        <SpaceBackground />
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#050507" />
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#675BFF" />
            <Text style={styles.loadingText}>กำลังโหลดข้อมูลการเคลม...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // =====================================================
  // CLAIM FORM
  // =====================================================

  if (view === 'form') {
    return (
      <View style={styles.container}>
        <SpaceBackground />
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#050507" />
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setView('list');
                setSelectedItem(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>🛠️ แจ้งเคลมสินค้า</Text>
              <Text style={styles.headerSubtitle}>ส่งคำขอเคลมสินค้า</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.formPadding}
            showsVerticalScrollIndicator={false}
          >
            {!selectedItem ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>เลือกสินค้าที่ต้องการเคลม</Text>
                  <Text style={styles.sectionSubtitle}>เลือกสินค้าจากรายการที่เคยสั่งซื้อ</Text>
                </View>

                {claimableItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>ไม่มีสินค้าที่สามารถเคลมได้</Text>
                    <Text style={styles.emptyText}>คุณยังไม่มีสินค้าที่ซื้อไว้สำหรับการเคลม</Text>
                  </View>
                ) : (
                  claimableItems.map(item => (
                    <TouchableOpacity
                      key={item.order_item_id}
                      style={styles.itemPickCard}
                      onPress={() => setSelectedItem(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.itemPickHeader}>
                        <View style={styles.productIcon}><Text>📦</Text></View>
                        <View style={styles.itemPickInfo}>
                          <Text style={styles.itemPickName} numberOfLines={2}>{item.product_name}</Text>
                          <Text style={styles.itemPickMeta}>Order #{item.order_id}</Text>
                          <Text style={styles.itemPickMeta}>จำนวน {item.quantity} ชิ้น</Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              <>
                <View style={styles.selectedItemCard}>
                  <View style={styles.selectedItemHeader}>
                    <View style={styles.productIconBlue}><Text>📦</Text></View>
                    <View style={styles.itemPickInfo}>
                      <Text style={styles.itemPickNameDark} numberOfLines={2}>{selectedItem.product_name}</Text>
                      <Text style={styles.itemPickMetaDark}>Order #{selectedItem.order_id}</Text>
                      <Text style={styles.itemPickMetaDark}>จำนวน {selectedItem.quantity} ชิ้น</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>เหตุผลในการเคลม</Text>
                  <Text style={styles.sectionSubtitle}>เลือกอาการที่พบ</Text>
                </View>
                <View style={styles.reasonGroup}>
                  {REASONS.map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                      onPress={() => setReason(r)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.reasonChipText, reason === r && styles.reasonChipTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>รายละเอียดเพิ่มเติม</Text>
                  <Text style={styles.sectionSubtitle}>อธิบายอาการหรือปัญหาที่พบ</Text>
                </View>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="อธิบายอาการที่พบเพิ่มเติม..."
                  placeholderTextColor="#7C8090"
                />

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleSubmitClaim}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>{submitting ? 'กำลังส่งเรื่อง...' : 'ส่งเรื่องเคลม'}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =====================================================
  // CLAIM LIST
  // =====================================================

  return (
    <View style={styles.container}>
      <SpaceBackground />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#050507" />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>🛠️ การเคลม</Text>
              <Text style={styles.headerSubtitle}>ติดตามสถานะการเคลมสินค้าของคุณ</Text>
            </View>
            <TouchableOpacity style={styles.newClaimBtn} onPress={() => setView('form')} activeOpacity={0.8}>
              <Text style={styles.newClaimIcon}>+</Text>
              <Text style={styles.newClaimBtnText}>เคลมใหม่</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.listPadding} showsVerticalScrollIndicator={false}>
          {claims.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>ยังไม่มีประวัติการเคลม</Text>
              <Text style={styles.emptyText}>เมื่อคุณส่งเรื่องเคลม ข้อมูลจะแสดงที่นี่</Text>
              <TouchableOpacity style={styles.emptyClaimBtn} onPress={() => setView('form')} activeOpacity={0.8}>
                <Text style={styles.emptyClaimBtnText}>+ แจ้งเคลมสินค้า</Text>
              </TouchableOpacity>
            </View>
          ) : (
            claims.map(c => (
              <TouchableOpacity key={c.id} style={styles.claimCard} onPress={() => openDetail(c.id)} activeOpacity={0.85}>
                <View style={styles.claimCardHeader}>
                  <View style={styles.claimHeaderLeft}>
                    <Text style={styles.claimId}>Claim #{c.id}</Text>
                    <Text style={styles.claimDate}>{new Date(c.created_at).toLocaleDateString('th-TH')}</Text>
                  </View>
                  <View style={styles.stageBadge}>
                    <Text style={styles.stageBadgeIcon}>🔵</Text>
                    <Text style={styles.stageBadgeText}>{c.stage_name}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>สินค้า</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>{c.product_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>เหตุผล</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>{c.reason}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailTitle}>📝 รายละเอียดการเคลม</Text>
                  <Text style={styles.detailText}>กดเพื่อดูรายละเอียดและสถานะการดำเนินการ</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.viewDetailText}>ดูรายละเอียด</Text>
                  <Text style={styles.viewDetailArrow}>→</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* CLAIM DETAIL MODAL */}
        {selectedDetail && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleArea}>
                    <Text style={styles.modalClaimId}>Claim #{selectedDetail.id}</Text>
                    <Text style={styles.modalTitle} numberOfLines={2}>{selectedDetail.product_name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedDetail(null)} style={styles.closeButton}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalStatus}>
                  <Text style={styles.modalStatusIcon}>🔵</Text>
                  <Text style={styles.modalStatusText}>{selectedDetail.stage_name}</Text>
                </View>

                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalInfoLabel}>เหตุผลในการเคลม</Text>
                  <Text style={styles.modalInfoValue}>{selectedDetail.reason}</Text>
                </View>

                {!!selectedDetail.description && (
                  <View style={styles.modalInfoBox}>
                    <Text style={styles.modalInfoLabel}>รายละเอียด</Text>
                    <Text style={styles.modalDescription}>{selectedDetail.description}</Text>
                  </View>
                )}

                <Text style={styles.timelineTitle}>สถานะการดำเนินการ</Text>
                <View style={styles.timeline}>
                  {selectedDetail.allStages.map((stage, index) => {
                    const isDone = stage.step_order <= selectedDetail.currentStage.step_order;
                    const isCurrent = stage.step_order === selectedDetail.currentStage.step_order;
                    return (
                      <View key={stage.id} style={styles.timelineRow}>
                        <View style={styles.timelineDotCol}>
                          <View style={[styles.timelineDot, isDone && styles.timelineDotDone, isCurrent && styles.timelineDotCurrent]}>
                            {isDone && <Text style={styles.timelineCheck}>✓</Text>}
                          </View>
                          {index < selectedDetail.allStages.length - 1 && (
                            <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                          )}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineLabel, isCurrent && styles.timelineLabelCurrent]}>{stage.name}</Text>
                          {isCurrent && <Text style={styles.currentText}>กำลังดำเนินการ</Text>}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Print Button */}
                <TouchableOpacity style={styles.printClaimBtn} onPress={generateClaimSlip} activeOpacity={0.8}>
                  <Text style={styles.printClaimBtnText}>🖨️ พิมพ์/แชร์ ใบเคลมสินค้า</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedDetail(null)} activeOpacity={0.8}>
                  <Text style={styles.modalCloseButtonText}>ปิดหน้าต่าง</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

// =======================================================
// SPACE BACKGROUND
// =======================================================

function SpaceBackground() {
  const meteorAnimations = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = meteorAnimations.map((animation, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 1200),
          Animated.timing(animation, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: true }),
          Animated.delay(2200),
          Animated.timing(animation, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach(animation => animation.start());
    return () => animations.forEach(animation => animation.stop());
  }, []);

  const stars = Array.from({ length: 70 }, (_, i) => ({
    x: (i * 47) % width,
    y: (i * 83) % height,
    size: i % 5 === 0 ? 2 : 1,
    opacity: 0.25 + ((i * 17) % 50) / 100,
  }));

  const positions = [
    { x: width * 0.90, y: height * 0.08 },
    { x: width * 0.72, y: height * 0.15 },
    { x: width * 0.45, y: height * 0.05 },
    { x: width * 0.95, y: height * 0.35 },
    { x: width * 0.65, y: height * 0.28 },
  ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.backgroundBase} />
      <View style={[styles.backgroundGlow, { left: width * 0.05, top: height * 0.08 }]} />
      <View style={[styles.backgroundGlow2, { left: width * 0.65, top: height * 0.40 }]} />
      {stars.map((star, index) => (
        <View key={index} style={{ position: 'absolute', left: star.x, top: star.y, width: star.size, height: star.size, borderRadius: star.size, backgroundColor: '#FFFFFF', opacity: star.opacity }} />
      ))}
      {positions.map((position, index) => (
        <Meteor key={index} x={position.x} y={position.y} animation={meteorAnimations[index]} />
      ))}
    </View>
  );
}

function Meteor({ x, y, animation }: { x: number; y: number; animation: Animated.Value }) {
  const translateX = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -170] });
  const translateY = animation.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });
  const opacity = animation.interpolate({ inputRange: [0, 0.08, 0.65, 1], outputRange: [0, 1, 0.75, 0] });

  return (
    <Animated.View style={[styles.thinMeteor, { left: x, top: y, opacity, transform: [{ translateX }, { translateY }, { rotate: '145deg' }] }]}>
      <View style={styles.meteorLineLong} />
      <View style={styles.meteorLineMid} />
      <View style={styles.meteorLineBright} />
      <View style={styles.meteorPoint} />
    </Animated.View>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050507' },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  backgroundBase: { ...StyleSheet.absoluteFillObject, backgroundColor: '#050507' },
  backgroundGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(75,55,180,0.08)' },
  backgroundGlow2: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(30,80,180,0.06)' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#A6A8B5', fontSize: 13 },
  header: { backgroundColor: 'rgba(8,8,12,0.90)', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 23, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { marginTop: 4, color: '#858894', fontSize: 13 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(92,80,255,0.14)', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(110,100,255,0.30)' },
  backButtonText: { fontSize: 24, fontWeight: '700', color: '#9B92FF' },
  newClaimBtn: { backgroundColor: 'rgba(92,80,255,0.22)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: 'rgba(110,100,255,0.50)' },
  newClaimIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  newClaimBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  listPadding: { padding: 20, paddingBottom: 40 },
  claimCard: { backgroundColor: 'rgba(12,12,18,0.88)', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  claimCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  claimHeaderLeft: { flex: 1 },
  claimId: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  claimDate: { marginTop: 5, fontSize: 12, color: '#777B87' },
  stageBadge: { backgroundColor: 'rgba(92,80,255,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', flexDirection: 'row', gap: 4, maxWidth: 150, borderWidth: 1, borderColor: 'rgba(110,100,255,0.25)' },
  stageBadgeIcon: { fontSize: 12 },
  stageBadgeText: { color: '#A49CFF', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 12 },
  infoLabel: { color: '#777B87', fontSize: 13 },
  infoValue: { color: '#E7E8ED', fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1 },
  detailBox: { marginTop: 5, backgroundColor: 'rgba(255,255,255,0.035)', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  detailTitle: { color: '#D9DAE1', fontSize: 13, fontWeight: '700' },
  detailText: { marginTop: 5, color: '#777B87', fontSize: 12, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 15 },
  viewDetailText: { color: '#9B92FF', fontSize: 13, fontWeight: '800' },
  viewDetailArrow: { marginLeft: 5, color: '#9B92FF', fontSize: 16, fontWeight: '800' },
  emptyCard: { backgroundColor: 'rgba(12,12,18,0.88)', borderRadius: 18, padding: 35, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  emptyText: { marginTop: 8, color: '#777B87', textAlign: 'center', lineHeight: 20, fontSize: 13 },
  emptyClaimBtn: { marginTop: 18, backgroundColor: 'rgba(92,80,255,0.22)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(110,100,255,0.40)' },
  emptyClaimBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  formPadding: { padding: 20, paddingBottom: 40 },
  sectionHeader: { marginBottom: 12, marginTop: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  sectionSubtitle: { marginTop: 4, color: '#777B87', fontSize: 12 },
  itemPickCard: { backgroundColor: 'rgba(12,12,18,0.88)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 16, padding: 15, marginBottom: 12 },
  itemPickHeader: { flexDirection: 'row', alignItems: 'center' },
  productIcon: { width: 45, height: 45, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  productIconBlue: { width: 45, height: 45, borderRadius: 12, backgroundColor: 'rgba(92,80,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemPickInfo: { flex: 1 },
  itemPickName: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  itemPickMeta: { fontSize: 11, color: '#777B87', marginTop: 4 },
  arrow: { color: '#777B87', fontSize: 25, marginLeft: 8 },
  selectedItemCard: { backgroundColor: 'rgba(12,12,18,0.88)', borderWidth: 1, borderColor: 'rgba(110,100,255,0.40)', borderRadius: 16, padding: 15, marginBottom: 20 },
  selectedItemHeader: { flexDirection: 'row', alignItems: 'center' },
  itemPickNameDark: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  itemPickMetaDark: { fontSize: 11, color: '#858894', marginTop: 4 },
  reasonGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  reasonChip: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.035)' },
  reasonChipActive: { backgroundColor: 'rgba(92,80,255,0.28)', borderColor: 'rgba(110,100,255,0.65)' },
  reasonChipText: { fontSize: 12, color: '#858894' },
  reasonChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  textArea: { backgroundColor: 'rgba(12,12,18,0.90)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 13, color: '#FFFFFF', fontSize: 13, minHeight: 90, textAlignVertical: 'top', marginBottom: 20 },
  submitBtn: { backgroundColor: 'rgba(92,80,255,0.80)', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(130,120,255,0.70)' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 100 },
  modalCard: { backgroundColor: '#0D0D12', borderRadius: 20, padding: 20, width: '100%', maxWidth: 430, maxHeight: '88%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitleArea: { flex: 1 },
  modalClaimId: { fontSize: 12, color: '#9B92FF', fontWeight: '800' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  closeButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  closeBtn: { fontSize: 16, color: '#858894' },
  modalStatus: { marginTop: 16, backgroundColor: 'rgba(92,80,255,0.14)', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(110,100,255,0.25)' },
  modalStatusIcon: { fontSize: 15, marginRight: 7 },
  modalStatusText: { color: '#A49CFF', fontSize: 13, fontWeight: '800' },
  modalInfoBox: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.035)', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalInfoLabel: { color: '#777B87', fontSize: 12, fontWeight: '700' },
  modalInfoValue: { marginTop: 5, color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  modalDescription: { marginTop: 5, color: '#A6A8B5', fontSize: 13, lineHeight: 20 },
  timelineTitle: { marginTop: 20, marginBottom: 14, color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  timeline: { paddingBottom: 5 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineDotCol: { alignItems: 'center', width: 28 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#292B34', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineDotDone: { backgroundColor: '#22C55E' },
  timelineDotCurrent: { backgroundColor: '#675BFF' },
  timelineCheck: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  timelineLine: { width: 2, flex: 1, minHeight: 38, backgroundColor: '#292B34' },
  timelineLineDone: { backgroundColor: '#22C55E' },
  timelineContent: { flex: 1, marginLeft: 10, paddingBottom: 22 },
  timelineLabel: { fontSize: 13, color: '#777B87', paddingTop: 1 },
  timelineLabelCurrent: { color: '#A49CFF', fontWeight: '800' },
  currentText: { marginTop: 3, fontSize: 11, color: '#777B87' },
  printClaimBtn: { backgroundColor: 'rgba(92,80,255,0.2)', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: 'rgba(110,100,255,0.5)' },
  printClaimBtnText: { color: '#A49CFF', fontSize: 13, fontWeight: '800' },
  modalCloseButton: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalCloseButtonText: { color: '#A6A8B5', fontSize: 13, fontWeight: '800' },
  thinMeteor: { position: 'absolute', width: 4, height: 4, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  meteorLineLong: { position: 'absolute', right: 1, top: 2, width: 120, height: 1, borderRadius: 10, backgroundColor: 'rgba(255,215,130,0.18)', shadowColor: '#FFD98A', shadowOpacity: 0.35, shadowRadius: 5 },
  meteorLineMid: { position: 'absolute', right: 1, top: 2, width: 75, height: 1, borderRadius: 10, backgroundColor: 'rgba(255,230,175,0.45)', shadowColor: '#FFE6B0', shadowOpacity: 0.55, shadowRadius: 5 },
  meteorLineBright: { position: 'absolute', right: 1, top: 2, width: 32, height: 1, borderRadius: 10, backgroundColor: '#FFF8E8', shadowColor: '#FFFFFF', shadowOpacity: 0.8, shadowRadius: 4 },
  meteorPoint: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF', shadowColor: '#FFF1C7', shadowOpacity: 1, shadowRadius: 5, elevation: 4 }
});