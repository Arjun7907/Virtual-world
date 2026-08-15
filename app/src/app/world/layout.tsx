import ProtectedShell from "@/components/ProtectedShell";

export default function WorldLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
