export async function GET() {
  return Response.json({ message: "Hello from backend!" });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ message: `Hello ${body.name}` });
}