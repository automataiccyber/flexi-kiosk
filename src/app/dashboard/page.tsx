import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function UserDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">User Dashboard</h1>
        <p className="text-gray-700 mb-4">
          Welcome to your dashboard, <span className="font-semibold">{session.user.name}</span>.
        </p>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="text-xl font-semibold text-blue-800">My Profile</h2>
          <p className="text-blue-700">Email: {session.user.email}</p>
          <p className="text-blue-700">Role: {session.user.role}</p>
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
