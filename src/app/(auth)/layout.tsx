export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white font-black text-lg">₺</span>
          </div>
          <div>
            <p className="font-extrabold text-xl text-foreground leading-tight">FinansApp</p>
            <p className="text-xs text-muted-foreground">Kişisel Finans Yönetimi</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
