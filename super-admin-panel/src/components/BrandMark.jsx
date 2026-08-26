import logo from "../assets/sot-logo.png";

export default function BrandMark() {
  return (
    <div className="brand-mark">
      <img src={logo} alt="SOT" className="logo-img" />
      <span>Super Admin</span>
    </div>
  );
}
