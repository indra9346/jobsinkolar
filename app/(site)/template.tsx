export default function Template({ children }: { children: React.ReactNode }) {
  // Re-mounts on every navigation, giving each page a short entrance animation.
  return <div className="animate-page">{children}</div>
}
