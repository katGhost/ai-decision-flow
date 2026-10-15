import { getRunResult } from '@/lib/workflow/store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  const result = getRunResult(eventId);
  console.log('STORE READ:', eventId, result);

  console.log(JSON.stringify(result, null, 2));

  if (!result) {
    return Response.json({ status: 'Pending' });
  }

  return Response.json({ status: 'Completed', output: result });
}

/*
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return Response.json({ error: 'eventId is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`http://localhost:8288/v1/events/${eventId}/runs`);
    const data = await res.json();

    console.log(JSON.stringify(data, null, 2));

    const run = data.data?.[0];

    if (!run) {
      return Response.json({ status: 'Pending' });
    }

    return Response.json({
      status: run.status,
      output: run.output,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
*/

