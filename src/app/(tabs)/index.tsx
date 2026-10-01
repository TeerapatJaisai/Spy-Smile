import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);

  const isSmall = width < 500;

  // ============================================================
  // ORBIT
  // ============================================================

  const orbitSize = isSmall ? 292 : 350;
  const radius = orbitSize / 2;

  const centerX = width / 2;

  const centerY = isSmall
    ? height * 0.47
    : height * 0.50;

  const rotation = useRef(
    new Animated.Value(0)
  ).current;

  // ============================================================
  // CHECK ADMIN
  // ============================================================

  useEffect(() => {
    if (Platform.OS === 'web') {
      const role =
        window.localStorage.getItem('role');

      setIsAdmin(
        role?.trim().toLowerCase() === 'admin'
      );
    }
  }, []);

  // ============================================================
  // ORBIT ROTATION
  // ============================================================

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [rotation]);

  const rotate =
    rotation.interpolate({
      inputRange: [0, 1],
      outputRange: [
        '0deg',
        '360deg',
      ],
    });

  const counterRotate =
    rotation.interpolate({
      inputRange: [0, 1],
      outputRange: [
        '0deg',
        '-360deg',
      ],
    });

  // ============================================================
  // MENU
  // ============================================================

  const menuItems = [
    {
      title: 'Products',
      icon: 'storefront-outline',
      route: '/product',
      show: true,
    },

    {
      title: 'Cart',
      icon: 'cart-outline',
      route: '/cart',
      show: true,
    },

    {
      title: 'Orders',
      icon: 'package-variant-closed',
      route: '/orders',
      show: true,
    },

    {
      title: 'Shipping',
      icon: 'truck-outline',
      route: '/shipping',
      show: true,
    },

    {
      title: 'Profile',
      icon: 'account-outline',
      route: '/profile',
      show: true,
    },

    {
      title: 'Claim',
      icon: 'shield-check-outline',
      route: '/claim',
      show: true,
    },

    {
      title: 'Claim Admin',
      icon: 'crown-outline',
      route: '/claim-admin',
      show: isAdmin,
    },

    {
      title: 'Dashboard',
      icon: 'chart-box-outline',
      route: '/dashboard',
      show: isAdmin,
    },
  ];

  const visibleItems =
    menuItems.filter(
      (item) => item.show
    );

  return (
    <View style={styles.container}>

      {/* ======================================================
          SPACE BACKGROUND
          ====================================================== */}

      <View
        pointerEvents="none"
        style={
          StyleSheet.absoluteFillObject
        }
      >

        {/* ==================================================
            BACKGROUND GLOW
            ================================================== */}

        <View
          style={
            styles.backgroundGlow
          }
        />

        {/* ==================================================
            STARS
            ================================================== */}

        <View
          style={
            styles.starsLayer
          }
        >

          <View
            style={[
              styles.star,
              {
                left: '12%',
                top: '18%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '28%',
                top: '12%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '44%',
                top: '22%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '63%',
                top: '14%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '82%',
                top: '20%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '91%',
                top: '42%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '16%',
                top: '48%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '35%',
                top: '65%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '72%',
                top: '67%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '87%',
                top: '78%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '8%',
                top: '82%',
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                left: '53%',
                top: '86%',
              },
            ]}
          />

        </View>

        {/* ==================================================
            METEORS
            ================================================== */}

        <Meteor
          index={0}
          width={width}
          height={height}
        />

        <Meteor
          index={1}
          width={width}
          height={height}
        />

        <Meteor
          index={2}
          width={width}
          height={height}
        />

        <Meteor
          index={3}
          width={width}
          height={height}
        />

        <Meteor
          index={4}
          width={width}
          height={height}
        />

      </View>

      {/* ======================================================
          TOP TITLE
          ====================================================== */}

      <View
        style={
          styles.topArea
        }
      >

        <Text
          style={
            styles.smallTitle
          }
        >
          IT STORE
        </Text>

        <Text
          style={
            styles.mainTitle
          }
        >
          Smart Inventory
        </Text>

        <Text
          style={
            styles.subTitle
          }
        >
          Manage your IT products
        </Text>

      </View>

      {/* ======================================================
          ORBIT
          ====================================================== */}

      <View
        style={[
          styles.orbitContainer,
          {
            width: orbitSize,
            height: orbitSize,

            left:
              centerX - radius,

            top:
              centerY - radius,
          },
        ]}
      >

        {/* ==================================================
            ORBIT LINE
            ================================================== */}

        <View
          style={[
            styles.orbitLine,
            {
              width: orbitSize,
              height: orbitSize,
              borderRadius: radius,
            },
          ]}
        />

        {/* ==================================================
            ROTATING MENU
            ================================================== */}

        <Animated.View
          style={[
            styles.rotationLayer,
            {
              width: orbitSize,
              height: orbitSize,

              transform: [
                {
                  rotate,
                },
              ],
            },
          ]}
        >

          {visibleItems.map(
            (item, index) => {

              const angle =
                (index /
                  visibleItems.length) *
                  Math.PI *
                  2 -
                Math.PI / 2;

              const x =
                Math.cos(angle) *
                radius;

              const y =
                Math.sin(angle) *
                radius;

              return (
                <Pressable
                  key={item.title}
                  onPress={() =>
                    router.push(
                      item.route as any
                    )
                  }
                  style={[
                    styles.node,
                    {
                      left:
                        radius +
                        x -
                        30,

                      top:
                        radius +
                        y -
                        30,
                    },
                  ]}
                >

                  {/* ==================================================
                      KEEP ICON STRAIGHT
                      ================================================== */}

                  <Animated.View
                    style={[
                      styles.nodeContent,
                      {
                        transform: [
                          {
                            rotate:
                              counterRotate,
                          },
                        ],
                      },
                    ]}
                  >

                    <View
                      style={
                        styles.iconCircle
                      }
                    >

                      <MaterialCommunityIcons
                        name={
                          item.icon as keyof typeof MaterialCommunityIcons.glyphMap
                        }
                        size={24}
                        color="#FFFFFF"
                      />

                    </View>

                    <Text
                      style={
                        styles.nodeLabel
                      }
                    >
                      {item.title}
                    </Text>

                  </Animated.View>

                </Pressable>
              );
            }
          )}

        </Animated.View>

        {/* ==================================================
            CENTER CORE
            ================================================== */}

        <View
          style={
            styles.centerCore
          }
        >

          <View
            style={
              styles.centerGlow
            }
          />

          <View
            style={
              styles.centerInner
            }
          >

            <MaterialCommunityIcons
              name="cpu"
              size={42}
              color="#FFFFFF"
            />

          </View>

        </View>

      </View>

      {/* ======================================================
          BOTTOM TEXT
          ====================================================== */}

      <View
        style={
          styles.bottomArea
        }
      >

        <Text
          style={
            styles.bottomTitle
          }
        >
          Choose a menu
        </Text>

        <Text
          style={
            styles.bottomText
          }
        >
          Tap an icon to continue
        </Text>

      </View>

      {/* ======================================================
          CHAT BOT BUTTON
          ====================================================== */}

      <Pressable
        onPress={() =>
          router.push('/ai-chat' as any)
        }
        style={({ pressed }) => [
          styles.chatBotButton,
          pressed &&
            styles.chatBotButtonPressed,
        ]}
      >

        {/* EMOJI */}

        <View
          style={
            styles.chatBotIcon
          }
        >
          <Text
            style={
              styles.chatBotEmoji
            }
          >
            🤖
          </Text>
        </View>

        {/* TEXT */}

        <View
          style={
            styles.chatBotTextArea
          }
        >

          <Text
            style={
              styles.chatBotTitle
            }
          >
            CHAT BOT
          </Text>

          <Text
            style={
              styles.chatBotSubTitle
            }
          >
            Ask AI
          </Text>

        </View>

        {/* ARROW */}

        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color="#A89CFF"
        />

      </Pressable>

    </View>
  );
}


// ============================================================
// METEOR
// ============================================================

function Meteor({
  index,
  width,
  height,
}: {
  index: number;
  width: number;
  height: number;
}) {

  const progress = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {

    let timer:
      ReturnType<typeof setTimeout>;

    const run = () => {

      progress.setValue(0);

      Animated.timing(
        progress,
        {
          toValue: 1,

          duration:
            1800 +
            index * 250,

          easing:
            Easing.out(
              Easing.quad
            ),

          useNativeDriver: true,
        }
      ).start(() => {

        timer =
          setTimeout(
            run,
            1800 +
              index * 700
          );

      });

    };

    timer =
      setTimeout(
        run,
        index * 1200
      );

    return () => {

      clearTimeout(timer);

      progress.stopAnimation();

    };

  }, [
    index,
    progress,
  ]);

  // ==========================================================
  // METEOR POSITIONS
  // ==========================================================

  const positions = [

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

  const start =
    positions[
      index %
        positions.length
    ];

  // ==========================================================
  // MOVEMENT
  // ==========================================================

  const translateX =
    progress.interpolate({
      inputRange: [0, 1],

      outputRange: [
        0,
        -width * 0.30,
      ],
    });

  const translateY =
    progress.interpolate({
      inputRange: [0, 1],

      outputRange: [
        0,
        height * 0.30,
      ],
    });

  // ==========================================================
  // OPACITY
  // ==========================================================

  const opacity =
    progress.interpolate({
      inputRange: [
        0,
        0.08,
        0.45,
        0.75,
        1,
      ],

      outputRange: [
        0,
        0.85,
        0.7,
        0.35,
        0,
      ],
    });

  // ==========================================================
  // SCALE
  // ==========================================================

  const scale =
    progress.interpolate({
      inputRange: [
        0,
        0.5,
        1,
      ],

      outputRange: [
        0.7,
        1,
        0.5,
      ],
    });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.thinMeteor,
        {
          left: start.x,
          top: start.y,

          opacity,

          transform: [

            {
              translateX,
            },

            {
              translateY,
            },

            {
              scale,
            },

            {
              rotate: '-45deg',
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
        style={
          styles.meteorPoint
        }
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

    backgroundColor:
      '#050507',

    overflow: 'hidden',

    position: 'relative',
  },

  // ==========================================================
  // BACKGROUND
  // ==========================================================

  backgroundGlow: {
    position: 'absolute',

    width: 600,
    height: 600,

    borderRadius: 300,

    left: '50%',
    top: '50%',

    marginLeft: -300,
    marginTop: -300,

    backgroundColor:
      'rgba(80,60,170,0.045)',

    shadowColor:
      '#675BFF',

    shadowOpacity: 0.15,

    shadowRadius: 100,
  },

  starsLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  star: {
    position: 'absolute',

    width: 2,
    height: 2,

    borderRadius: 2,

    backgroundColor:
      '#FFFFFF',

    shadowColor:
      '#FFD66B',

    shadowOpacity: 0.9,

    shadowRadius: 5,

    elevation: 3,
  },

  // ==========================================================
  // METEOR
  // ==========================================================

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

    shadowColor:
      '#FFD98A',

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

    shadowColor:
      '#FFE6B0',

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

    shadowColor:
      '#FFFFFF',

    shadowOpacity: 0.8,

    shadowRadius: 4,
  },

  meteorPoint: {
    position: 'absolute',

    width: 3,
    height: 3,

    borderRadius: 2,

    backgroundColor:
      '#FFFFFF',

    shadowColor:
      '#FFF1C7',

    shadowOpacity: 1,

    shadowRadius: 5,

    elevation: 4,
  },

  // ==========================================================
  // TOP
  // ==========================================================

  topArea: {
    position: 'absolute',

    top: 35,

    left: 0,
    right: 0,

    alignItems: 'center',

    zIndex: 10,
  },

  smallTitle: {
    color: '#777B85',

    fontSize: 11,

    fontWeight: '700',

    letterSpacing: 4,
  },

  mainTitle: {
    marginTop: 6,

    color: '#FFFFFF',

    fontSize: 25,

    fontWeight: '800',

    letterSpacing: 1,
  },

  subTitle: {
    marginTop: 5,

    color: '#777B85',

    fontSize: 12,
  },

  // ==========================================================
  // ORBIT
  // ==========================================================

  orbitContainer: {
    position: 'absolute',

    alignItems: 'center',

    justifyContent: 'center',

    zIndex: 5,
  },

  orbitLine: {
    position: 'absolute',

    borderWidth: 1,

    borderColor:
      'rgba(125,113,255,0.45)',

    shadowColor:
      '#695CFF',

    shadowOpacity: 0.35,

    shadowRadius: 12,

    elevation: 3,
  },

  rotationLayer: {
    position: 'absolute',

    left: 0,

    top: 0,
  },

  // ==========================================================
  // NODE
  // ==========================================================

  node: {
    position: 'absolute',

    width: 60,
    height: 60,

    alignItems: 'center',

    justifyContent: 'center',
  },

  nodeContent: {
    alignItems: 'center',

    justifyContent: 'center',

    width: 100,

    minHeight: 80,

    marginLeft: -20,

    marginTop: -10,
  },

  iconCircle: {
    width: 52,
    height: 52,

    borderRadius: 26,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor:
      'rgba(10,10,18,0.95)',

    borderWidth: 1,

    borderColor:
      'rgba(130,120,255,0.65)',

    shadowColor:
      '#6558FF',

    shadowOpacity: 0.7,

    shadowRadius: 12,

    elevation: 8,
  },

  nodeLabel: {
    marginTop: 6,

    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '600',

    textAlign: 'center',

    textShadowColor:
      '#000000',

    textShadowOffset: {
      width: 0,
      height: 1,
    },

    textShadowRadius: 4,
  },

  // ==========================================================
  // CENTER
  // ==========================================================

  centerCore: {
    width: 100,
    height: 100,

    borderRadius: 50,

    alignItems: 'center',

    justifyContent: 'center',

    position: 'absolute',

    left: '50%',

    top: '50%',

    marginLeft: -50,

    marginTop: -50,

    backgroundColor:
      'rgba(40,30,120,0.35)',

    shadowColor:
      '#675BFF',

    shadowOpacity: 0.9,

    shadowRadius: 30,

    elevation: 15,
  },

  centerGlow: {
    position: 'absolute',

    width: 120,
    height: 120,

    borderRadius: 60,

    backgroundColor:
      'rgba(85,70,255,0.10)',

    shadowColor:
      '#675BFF',

    shadowOpacity: 0.9,

    shadowRadius: 35,
  },

  centerInner: {
    width: 72,
    height: 72,

    borderRadius: 36,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor:
      '#17152F',

    borderWidth: 1,

    borderColor:
      'rgba(140,130,255,0.65)',

    shadowColor:
      '#6A5CFF',

    shadowOpacity: 0.8,

    shadowRadius: 18,

    elevation: 10,
  },

  // ==========================================================
  // BOTTOM
  // ==========================================================

  bottomArea: {
    position: 'absolute',

    left: 0,
    right: 0,

    bottom: 28,

    alignItems: 'center',

    zIndex: 10,
  },

  bottomTitle: {
    color: '#FFFFFF',

    fontSize: 13,

    fontWeight: '700',
  },

  bottomText: {
    marginTop: 4,

    color: '#666A73',

    fontSize: 11,
  },

  // ==========================================================
  // CHAT BOT
  // ==========================================================

  chatBotButton: {
    position: 'absolute',

    right: 10,

    bottom: 70,

    width: 125,
    height: 48,

    paddingHorizontal: 8,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      'rgba(15,13,30,0.96)',

    borderWidth: 1,

    borderColor:
      'rgba(110,95,255,0.75)',

    borderRadius: 14,

    shadowColor:
      '#675BFF',

    shadowOpacity: 0.5,

    shadowRadius: 12,

    elevation: 10,

    zIndex: 100,
  },

  chatBotButtonPressed: {
    transform: [
      {
        scale: 0.96,
      },
    ],

    backgroundColor:
      'rgba(30,25,60,0.98)',
  },

  chatBotIcon: {
    width: 32,
    height: 32,

    borderRadius: 16,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(100,85,255,0.18)',

    borderWidth: 1,

    borderColor:
      'rgba(140,125,255,0.55)',

    marginRight: 6,
  },

  chatBotEmoji: {
    fontSize: 18,
  },

  chatBotTextArea: {
    flex: 1,

    justifyContent: 'center',
  },

  chatBotTitle: {
    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '800',

    letterSpacing: 0.8,
  },

  chatBotSubTitle: {
    color: '#777B85',

    fontSize: 8,

    marginTop: 1,
  },

});