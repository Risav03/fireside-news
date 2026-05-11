import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-2 w-32">
      <Image src="/fireside-logo.svg" alt="FIRESIDE logo" width={100} height={100} className="aspect-square w-[15%]"/>
      <Image src="/fireside-name.png" alt="FIRESIDE NEWS" width={100} height={100} className="w-[70%]"/>
    </div>
  );
}