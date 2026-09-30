import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      if (Platform.OS === 'web') {
        window.alert('กรุณากรอก Username และ Password');
      } else {
        Alert.alert(
          'Error',
          'กรุณากรอก Username และ Password'
        );
      }
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (Platform.OS === 'web') {
          window.localStorage.setItem(
            'isLoggedIn',
            'true'
          );

          window.localStorage.setItem(
            'username',
            data.user.username
          );

          window.localStorage.setItem(
            'role',
            data.user.role || 'user'
          );

          window.localStorage.setItem(
            'userId',
            data.user.id.toString()
          );
        } else {
          Alert.alert(
            'Success',
            'เข้าสู่ระบบสำเร็จ!'
          );
        }

        router.replace('/');
      } else {
        if (Platform.OS === 'web') {
          window.alert(
            data.error ||
              'Username หรือ Password ไม่ถูกต้อง'
          );
        } else {
          Alert.alert(
            'Error',
            data.error ||
              'Username หรือ Password ไม่ถูกต้อง'
          );
        }
      }
    } catch (err) {
      console.log('LOGIN ERROR:', err);

      if (Platform.OS === 'web') {
        window.alert(
          'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
        );
      } else {
        Alert.alert(
          'Error',
          'Cannot connect to server'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.8],
  });

  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.15],
  });

  return (
    <View style={styles.container}>

      {/* =========================
          SPACE BACKGROUND
      ========================== */}
      <SpaceBackground />

      {/* =========================
          TOP TITLE
      ========================== */}
      <View style={styles.topTitle}>
        <Text style={styles.brand}>
          IT INVENTORY
        </Text>

        <Text style={styles.brandSub}>
          SYSTEM ACCESS
        </Text>
      </View>

      {/* =========================
          LOGIN CARD
      ========================== */}
      <View style={styles.centerArea}>
        <Animated.View
          style={[
            styles.cardGlow,
            {
              opacity: glowOpacity,
              transform: [
                {
                  scale: glowScale,
                },
              ],
            },
          ]}
        />

        <View style={styles.card}>

          {/* Logo */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoOuter}>
              <View style={styles.logoInner}>
                <Text style={styles.logoText}>
                  IT
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.title}>
            WELCOME BACK
          </Text>

          <Text style={styles.subtitle}>
            SIGN IN TO YOUR ACCOUNT
          </Text>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              USERNAME
            </Text>

            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor="#626878"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              PASSWORD
            </Text>

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#626878"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onSubmitEditing={handleLogin}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.mainBtn,
              loading && styles.mainBtnDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.mainBtnText}>
              {loading
                ? 'SIGNING IN...'
                : 'SIGN IN'}
            </Text>
          </TouchableOpacity>

          {/* Links */}
          <View style={styles.linkContainer}>

            <TouchableOpacity
              onPress={() =>
                router.push('/forgot')
              }
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.push('/register')
              }
              disabled={loading}
            >
              <Text
                style={[
                  styles.linkText,
                  styles.linkHighlight,
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>

      {/* =========================
          BOTTOM TEXT
      ========================== */}
      <View style={styles.bottomText}>
        <Text style={styles.bottomMain}>
          SECURE SYSTEM
        </Text>

        <Text style={styles.bottomSub}>
          AUTHORIZED USERS ONLY
        </Text>
      </View>
    </View>
  );
}

/* =====================================================
   SPACE BACKGROUND
===================================================== */

function SpaceBackground() {
  const stars = [
    { x: 0.08, y: 0.12, size: 2 },
    { x: 0.18, y: 0.28, size: 1 },
    { x: 0.27, y: 0.08, size: 2 },
    { x: 0.36, y: 0.20, size: 1 },
    { x: 0.48, y: 0.10, size: 2 },
    { x: 0.58, y: 0.24, size: 1 },
    { x: 0.69, y: 0.09, size: 2 },
    { x: 0.78, y: 0.22, size: 1 },
    { x: 0.89, y: 0.13, size: 2 },
    { x: 0.95, y: 0.27, size: 1 },

    { x: 0.06, y: 0.48, size: 1 },
    { x: 0.20, y: 0.58, size: 2 },
    { x: 0.34, y: 0.46, size: 1 },
    { x: 0.67, y: 0.51, size: 2 },
    { x: 0.84, y: 0.57, size: 1 },

    { x: 0.12, y: 0.78, size: 2 },
    { x: 0.29, y: 0.88, size: 1 },
    { x: 0.44, y: 0.76, size: 2 },
    { x: 0.63, y: 0.86, size: 1 },
    { x: 0.82, y: 0.77, size: 2 },
    { x: 0.94, y: 0.91, size: 1 },
  ];

  const meteors = [
    {
      x: width * 0.88,
      y: height * 0.13,
    },
    {
      x: width * 0.16,
      y: height * 0.20,
    },
    {
      x: width * 0.78,
      y: height * 0.37,
    },
    {
      x: width * 0.08,
      y: height * 0.68,
    },
  ];

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {/* Base */}
      <View style={styles.spaceBase} />

      {/* Blue Glow */}
      <View
        style={[
          styles.spaceGlow,
          styles.spaceGlowBlue,
        ]}
      />

      {/* Purple Glow */}
      <View
        style={[
          styles.spaceGlow,
          styles.spaceGlowPurple,
        ]}
      />

      {/* Stars */}
      {stars.map((star, index) => (
        <View
          key={`star-${index}`}
          style={[
            styles.star,
            {
              left: width * star.x,
              top: height * star.y,
              width: star.size,
              height: star.size,
              borderRadius:
                star.size / 2,
            },
          ]}
        />
      ))}

      {/* Meteors */}
      {meteors.map((meteor, index) => (
        <View
          key={`meteor-${index}`}
          style={[
            styles.thinMeteor,
            {
              left: meteor.x,
              top: meteor.y,
            },
          ]}
        >
          <View style={styles.meteorLong} />
          <View style={styles.meteorMid} />
          <View style={styles.meteorBright} />
          <View style={styles.meteorPoint} />
        </View>
      ))}

      {/* Bottom glow */}
      <View style={styles.bottomGlow} />
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  spaceBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#030408',
  },

  spaceGlow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
  },

  spaceGlowBlue: {
    left: -150,
    top: height * 0.05,
    backgroundColor:
      'rgba(35,70,180,0.12)',
    shadowColor: '#315CFF',
    shadowOpacity: 0.35,
    shadowRadius: 100,
  },

  spaceGlowPurple: {
    right: -160,
    bottom: height * 0.05,
    backgroundColor:
      'rgba(95,45,180,0.12)',
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.35,
    shadowRadius: 100,
  },

  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.65,
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
  },

  meteorLong: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 115,
    height: 1,
    borderRadius: 10,
    backgroundColor:
      'rgba(255,215,130,0.14)',
    shadowColor: '#FFD98A',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  meteorMid: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 72,
    height: 1,
    borderRadius: 10,
    backgroundColor:
      'rgba(255,230,175,0.35)',
    shadowColor: '#FFE6B0',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },

  meteorBright: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 30,
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

  bottomGlow: {
    position: 'absolute',
    width: width * 1.2,
    height: 180,
    borderRadius: 200,
    bottom: -120,
    backgroundColor:
      'rgba(60,45,150,0.10)',
    shadowColor: '#6655FF',
    shadowOpacity: 0.5,
    shadowRadius: 80,
  },

  /* =========================
     TOP
  ========================== */

  topTitle: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 35 : 55,
    alignItems: 'center',
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 5,
  },

  brandSub: {
    color: '#7168FF',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 5,
  },

  /* =========================
     CENTER
  ========================== */

  centerArea: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardGlow: {
    position: 'absolute',
    width: 360,
    height: 440,
    borderRadius: 40,
    backgroundColor:
      'rgba(82,70,255,0.10)',
    shadowColor: '#6558FF',
    shadowOpacity: 0.8,
    shadowRadius: 70,
  },

  card: {
    width: '100%',
    maxWidth: 390,
    backgroundColor:
      'rgba(8,10,18,0.92)',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 26,

    borderWidth: 1,
    borderColor:
      'rgba(108,98,255,0.28)',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.65,
    shadowRadius: 35,
    elevation: 12,
  },

  /* =========================
     LOGO
  ========================== */

  logoWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },

  logoOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(73,61,220,0.18)',

    borderWidth: 1,
    borderColor:
      'rgba(117,105,255,0.55)',

    shadowColor: '#685BFF',
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 8,
  },

  logoInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(70,58,180,0.28)',

    borderWidth: 1,
    borderColor:
      'rgba(130,120,255,0.45)',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },

  /* =========================
     TEXT
  ========================== */

  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },

  subtitle: {
    color: '#777D91',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 7,
    marginBottom: 30,
  },

  /* =========================
     INPUT
  ========================== */

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    color: '#858A9A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  input: {
    height: 52,
    backgroundColor:
      'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    borderRadius: 12,

    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 15,

    outlineStyle: 'none',
  },

  /* =========================
     BUTTON
  ========================== */

  mainBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 5,

    backgroundColor: '#635BFF',

    borderWidth: 1,
    borderColor:
      'rgba(150,140,255,0.65)',

    shadowColor: '#6258FF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 7,
  },

  mainBtnDisabled: {
    opacity: 0.55,
  },

  mainBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },

  /* =========================
     LINKS
  ========================== */

  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },

  linkText: {
    color: '#777D91',
    fontSize: 11,
    fontWeight: '600',
  },

  linkHighlight: {
    color: '#8C82FF',
  },

  /* =========================
     BOTTOM
  ========================== */

  bottomText: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 25 : 35,
    alignItems: 'center',
  },

  bottomMain: {
    color: '#555A6A',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
  },

  bottomSub: {
    color: '#303440',
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 4,
  },
});