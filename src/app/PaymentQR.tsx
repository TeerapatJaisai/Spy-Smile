import React, { useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import generatePayload from 'promptpay-qr';

type PaymentQRProps = {
  visible: boolean;
  amount: number;
  accountName: string;
  promptPayId: string;
  orderId?: number | string;
  onClose: () => void;
  onPaid: () => void;
};

export default function PaymentQR({
  visible,
  amount,
  accountName,
  promptPayId,
  orderId,
  onClose,
  onPaid,
}: PaymentQRProps) {
  const qrValue = useMemo(() => {
    try {
      return generatePayload(promptPayId, {
        amount: Number(amount),
      });
    } catch (error) {
      console.log('PROMPTPAY QR ERROR:', error);
      return '';
    }
  }, [promptPayId, amount]);

  const money = Number(amount || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>

          <Text style={styles.title}>
            ชำระเงิน
          </Text>

          <Text style={styles.subtitle}>
            สแกน QR Code เพื่อชำระเงิน
          </Text>

          <View style={styles.qrBox}>
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={230}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            ) : (
              <Text style={styles.errorText}>
                ไม่สามารถสร้าง QR Code ได้
              </Text>
            )}
          </View>

          <View style={styles.infoBox}>

            <View style={styles.infoRow}>
              <Text style={styles.label}>
                ชื่อบัญชี
              </Text>

              <Text style={styles.value}>
                {accountName}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>
                ยอดที่ต้องชำระ
              </Text>

              <Text style={styles.amount}>
                ฿{money}
              </Text>
            </View>

            {orderId && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Order ID
                </Text>

                <Text style={styles.value}>
                  #{orderId}
                </Text>
              </View>
            )}

          </View>

          <Text style={styles.note}>
            กรุณาตรวจสอบยอดเงินก่อนชำระ
          </Text>

          <TouchableOpacity
            style={styles.paidButton}
            onPress={onPaid}
          >
            <Text style={styles.paidButtonText}>
              ฉันชำระเงินแล้ว
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>
              ยกเลิก
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#101018',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#39316F',
    padding: 24,
    alignItems: 'center',

    shadowColor: '#6C5CFF',
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 15,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 5,
  },

  subtitle: {
    color: '#8D8A9A',
    fontSize: 13,
    marginBottom: 20,
  },

  qrBox: {
    width: 260,
    height: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginBottom: 20,
  },

  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },

  infoBox: {
    width: '100%',
    backgroundColor: '#181720',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 15,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  label: {
    color: '#85828F',
    fontSize: 13,
  },

  value: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  amount: {
    color: '#A99CFF',
    fontSize: 22,
    fontWeight: '900',
  },

  note: {
    color: '#777480',
    fontSize: 12,
    marginTop: 15,
    marginBottom: 15,
    textAlign: 'center',
  },

  paidButton: {
    width: '100%',
    backgroundColor: '#6258FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,

    shadowColor: '#6258FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },

  paidButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  closeButton: {
    width: '100%',
    backgroundColor: '#1B1A22',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },

  closeButtonText: {
    color: '#AAA7B4',
    fontSize: 14,
    fontWeight: '600',
  },
});