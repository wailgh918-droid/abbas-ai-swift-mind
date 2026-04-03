import wolfLogo from "@/assets/wolf-logo.png";

interface WolfLogoProps {
  size?: number;
  className?: string;
}

const WolfLogo = ({ size = 32, className = "" }: WolfLogoProps) => (
  <img
    src={wolfLogo}
    alt="عباس"
    width={size}
    height={size}
    className={`object-contain ${className}`}
  />
);

export default WolfLogo;
