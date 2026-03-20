export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <span className="text-3xl font-medium text-purple-600">にほんご</span>
        <p className="mt-4 text-sm text-gray-500">
          Fitur lupa password akan segera tersedia.
        </p>
        <a href="/auth/login" className="mt-4 inline-block text-sm text-purple-600 hover:underline">
          Kembali ke halaman masuk
        </a>
      </div>
    </div>
  );
}
