/** 대표 성씨별 아바타 배경 (Tailwind 클래스) */
export function surnameAvatarBgClass(displayName: string): string {
  const ch = displayName.replace(/\s/g, "")[0];
  switch (ch) {
    case "김":
      return "bg-[#2563eb]";
    case "이":
      return "bg-[#059669]";
    case "박":
      return "bg-[#7c3aed]";
    case "최":
      return "bg-[#ea580c]";
    case "정":
      return "bg-[#dc2626]";
    default:
      return "bg-[#64748b]";
  }
}
