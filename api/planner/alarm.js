import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
}

function sendResponse(res, status, json) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(json);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
  res.end(JSON.stringify(json));
}

export default async function handler(req, res) {
  const token = req.query?.token;
  const user = (req.query?.user || 'me').toLowerCase();
  const supabase = getSupabase();
  
  // Date in YYYY-MM-DD or today
  let date = req.query?.date;
  if (!date) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return sendResponse(res, 400, { error: 'Valid calendar feed token is required' });
  }

  if (!supabase) {
    return sendResponse(res, 500, { error: 'Database client not initialized' });
  }

  try {
    const { data, error } = await supabase.rpc('get_planner_alarm_data', {
      p_token: token,
      p_date: date,
      p_user: user
    });

    if (error || !data) {
      return sendResponse(res, 404, { error: 'Planner data not found or invalid token' });
    }

    return sendResponse(res, 200, data);
  } catch (err) {
    console.error('Alarm helper error:', err);
    return sendResponse(res, 500, { error: 'Internal Server Error' });
  }
}
