import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-4 text-xl text-gray-700">You do not have permission to view this page.</p>
        <Link href="/" className="mt-6 text-blue-600 hover:underline">
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold text-red-600 mb-6">Admin Dashboard</h1>
        <p className="text-gray-700 mb-4">
          Welcome to the restricted Admin area, <span className="font-semibold">{session.user.name}</span>.
        </p>
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-xl font-semibold text-red-800">Admin Controls</h2>
          <p className="text-red-700">Here you can manage users, settings, and more.</p>
        </div>
        <div className="mt-6">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
