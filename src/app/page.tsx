import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { signOut } from "next-auth/react"; // signOut is client side, so we need a client component for the button or a form

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-blue-600">
          Flexi App
        </h1>

        <p className="mt-3 text-2xl text-gray-700">
          Role Based Access Control Demo
        </p>

        <div className="mt-8">
          {session ? (
            <div className="space-y-4">
              <p className="text-xl text-black">
                Welcome, <span className="font-bold">{session.user?.name}</span>!
              </p>
              <p className="text-lg text-gray-600">
                Your role is: <span className="font-bold uppercase text-blue-500">{session.user?.role}</span>
              </p>
              
              <div className="flex flex-col space-y-3">
                {session.user?.role === "admin" && (
                  <Link href="/admin" className="px-6 py-3 text-white bg-red-500 rounded hover:bg-red-600 transition">
                    Go to Admin Dashboard
                  </Link>
                )}
                {(session.user?.role === "user" || session.user?.role === "admin") && (
                   <Link href="/dashboard" className="px-6 py-3 text-white bg-green-500 rounded hover:bg-green-600 transition">
                    Go to User Dashboard
                  </Link>
                )}
                
                <Link href="/api/auth/signout" className="px-6 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition">
                  Sign Out
                </Link>
              </div>
            </div>
          ) : (
            <Link href="/login" className="px-8 py-4 text-xl font-bold text-white bg-blue-600 rounded hover:bg-blue-700 transition">
              Log In to Start
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
