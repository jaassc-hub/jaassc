import Image from "next/image";

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Logo Junta de Agua y Saneamiento Santa Cruz"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
      priority
    />
  );
}
