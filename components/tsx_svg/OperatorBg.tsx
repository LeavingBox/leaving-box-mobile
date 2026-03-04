import * as React from "react";
import Svg, {
  SvgProps,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
const AnalystBg = (props: SvgProps) => (
  <Svg width={395} height={673} fill="none" {...props}>
    <Path
      fill="url(#a)"
      stroke="#000"
      d="M1 472.851V672h393V2L1 311.88v160.971Z"
    />
    <Defs>
      <LinearGradient
        id="a"
        x1={197.839}
        x2={197.839}
        y1={41.938}
        y2={683.922}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#92D7DD" />
        <Stop offset={0.5} stopColor="#46B2C5" />
        <Stop offset={1} stopColor="#005893" />
      </LinearGradient>
    </Defs>
  </Svg>
);
export default AnalystBg;
