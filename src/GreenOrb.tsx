import Orb from "./Orb";
export default function GreenOrb() {
  return <Orb colors={["#BCE88A", "#3FAD66", "#D8FFAE"]} hoverIntensity={.7} trail={.8} rotateOnHover followCursor />;
}
