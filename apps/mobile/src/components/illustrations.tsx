import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

// Hình minh họa vẽ bằng SVG cho các màn hình đăng ký, quên mật khẩu, xác thực.
const GREEN = '#14604D';
const LEAF = '#4B9B7A';
const SOFT = '#DCEFE6';

function Cloud({ x, y }: { x: number; y: number }) {
  return (
    <G opacity={0.9}>
      <Ellipse cx={x} cy={y} rx={22} ry={8} fill="#E9EEF0" />
      <Ellipse cx={x + 12} cy={y - 5} rx={12} ry={7} fill="#E9EEF0" />
    </G>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-2} y={10} width={4} height={14} rx={2} fill="#7A5C3E" />
      <Circle cx={0} cy={0} r={14} fill={LEAF} />
      <Circle cx={-8} cy={8} r={9} fill="#3F8A6B" />
      <Circle cx={8} cy={7} r={10} fill="#5AAE8A" />
    </G>
  );
}

export function MapPinIllustration({ width = 220 }: { width?: number }) {
  return (
    <Svg width={width} height={(width * 150) / 220} viewBox="0 0 220 150">
      <Cloud x={34} y={28} />
      <Cloud x={176} y={20} />
      <Path d="M48 104 L96 90 L140 104 L184 92 L142 128 L92 120 Z" fill={SOFT} />
      <Path d="M96 90 L92 120 M140 104 L142 128" stroke="#C3E2D3" strokeWidth={2} />
      <Tree x={40} y={86} />
      <Tree x={188} y={88} s={0.9} />
      <Path
        d="M114 18 C95 18 84 33 84 47 C84 68 114 100 114 100 C114 100 144 68 144 47 C144 33 133 18 114 18 Z"
        fill="#F08A24"
      />
      <Circle cx={114} cy={47} r={13} fill="#fff" />
    </Svg>
  );
}

export function EnvelopeIllustration({ width = 220 }: { width?: number }) {
  return (
    <Svg width={width} height={(width * 150) / 220} viewBox="0 0 220 150">
      <Ellipse cx={110} cy={118} rx={80} ry={14} fill={SOFT} />
      <Path d="M150 30 L196 14 L172 50 L162 40 Z" fill={GREEN} />
      <Path d="M150 30 L162 40 L158 54 Z" fill="#0E4A3B" />
      <Path
        d="M40 70 C70 40 110 30 146 32"
        stroke={GREEN}
        strokeWidth={2}
        strokeDasharray="5 5"
        fill="none"
      />
      <Rect
        x={58}
        y={64}
        width={110}
        height={70}
        rx={10}
        fill="#fff"
        stroke={GREEN}
        strokeWidth={3}
      />
      <Path
        d="M58 72 L113 108 L168 72"
        stroke={GREEN}
        strokeWidth={3}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M58 128 L96 96 M168 128 L130 96" stroke="#9CC9B8" strokeWidth={2} />
    </Svg>
  );
}

export function ShieldIllustration({ width = 200 }: { width?: number }) {
  return (
    <Svg width={width} height={(width * 150) / 200} viewBox="0 0 200 150">
      <Circle cx={30} cy={40} r={4} fill="#9CC9B8" />
      <Circle cx={170} cy={28} r={3} fill="#9CC9B8" />
      <Circle cx={176} cy={110} r={6} fill={LEAF} />
      <Ellipse cx={100} cy={128} rx={56} ry={10} fill={SOFT} />
      <Path
        d="M100 16 L150 34 V72 C150 100 128 120 100 130 C72 120 50 100 50 72 V34 Z"
        fill={GREEN}
      />
      <Path d="M100 26 L140 40 V72 C140 94 123 111 100 120 Z" fill="#1B7A63" />
      <Circle cx={100} cy={74} r={22} fill="#fff" />
      <Path
        d="M89 74 L97 82 L112 66"
        stroke={GREEN}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Lá trang trí góc dưới bên phải của các màn hình xác thực.
export function LeafDecor() {
  return (
    <Svg
      width={120}
      height={120}
      viewBox="0 0 120 120"
      style={{ position: 'absolute', right: 0, bottom: 0 }}
    >
      <Path d="M120 120 C60 120 30 80 40 30 C80 40 120 70 120 120 Z" fill="#E3F1EC" />
      <Path d="M120 120 C95 90 75 70 50 45" stroke="#C3E2D3" strokeWidth={3} fill="none" />
      <Path d="M120 120 C80 118 60 100 56 70 C90 76 112 96 120 120 Z" fill="#CFE8DC" />
    </Svg>
  );
}
