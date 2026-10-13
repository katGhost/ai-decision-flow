import { inngest } from "@/lib/inngest/client";

export async function POST(request) {
  try {
    const { nodes, edges, startId } = await request.json();

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return Response.json(
        { error: "nodes and edges must be arrays." },
        { status: 400 }
      );
    }

    const { ids } = await inngest.send({
      name: "workflow/run",
      data: { nodes, edges, startId },
    });

    return Response.json({
      message: "Workflow triggered.",
      eventId: ids[0],
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Something went wrong." },
      { status: 500 }
    );
  }
}