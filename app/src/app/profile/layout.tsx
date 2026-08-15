import ProtectedShell from "@/components/ProtectedShell";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
