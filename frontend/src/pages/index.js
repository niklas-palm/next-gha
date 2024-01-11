export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      hello {process.env.NEXT_PUBLIC_API_URL}
    </main>
  );
}
