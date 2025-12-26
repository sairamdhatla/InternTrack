import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Application {
  id: string;
  company: string;
  role: string;
  platform: string | null;
  status: string;
  applied_date: string;
  deadline_date: string | null;
  follow_up_count?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'csv';

    console.log(`Export requested by user ${user.id} in format: ${format}`);

    // Fetch user's applications with follow-up counts
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('id, company, role, platform, status, applied_date, deadline_date')
      .order('applied_date', { ascending: false });

    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch applications' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get follow-up counts for each application
    const { data: followUps, error: followUpsError } = await supabase
      .from('follow_ups')
      .select('application_id');

    if (followUpsError) {
      console.error('Error fetching follow-ups:', followUpsError);
    }

    // Count follow-ups per application
    const followUpCounts: Record<string, number> = {};
    if (followUps) {
      followUps.forEach((f) => {
        followUpCounts[f.application_id] = (followUpCounts[f.application_id] || 0) + 1;
      });
    }

    const appsWithCounts: Application[] = (applications || []).map((app) => ({
      ...app,
      follow_up_count: followUpCounts[app.id] || 0,
    }));

    console.log(`Found ${appsWithCounts.length} applications for export`);

    if (format === 'csv') {
      return generateCSV(appsWithCounts);
    } else if (format === 'pdf') {
      return generatePDF(appsWithCounts);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateCSV(applications: Application[]): Response {
  const headers = ['Company', 'Role', 'Platform', 'Status', 'Applied Date', 'Deadline Date', 'Follow-ups'];
  
  const escapeCSV = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = applications.map((app) => [
    escapeCSV(app.company),
    escapeCSV(app.role),
    escapeCSV(app.platform),
    escapeCSV(app.status),
    escapeCSV(app.applied_date),
    escapeCSV(app.deadline_date),
    String(app.follow_up_count || 0),
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');

  return new Response(csv, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

function generatePDF(applications: Application[]): Response {
  // Generate a simple PDF manually
  const title = 'InternTrack - Applications Export';
  const date = new Date().toLocaleDateString();
  
  // PDF structure
  const objects: string[] = [];
  let objectCount = 0;
  
  const addObject = (content: string): number => {
    objectCount++;
    objects.push(content);
    return objectCount;
  };

  // Build content stream
  let yPos = 750;
  const lineHeight = 14;
  const pageWidth = 595;
  const margin = 40;
  
  let contentLines: string[] = [];
  
  // Title
  contentLines.push(`BT /F1 18 Tf ${margin} ${yPos} Td (${escapeForPDF(title)}) Tj ET`);
  yPos -= 30;
  
  // Date
  contentLines.push(`BT /F1 10 Tf ${margin} ${yPos} Td (Exported on: ${escapeForPDF(date)}) Tj ET`);
  yPos -= 30;
  
  // Table headers
  const headers = ['Company', 'Role', 'Platform', 'Status', 'Applied', 'Deadline', 'Follow-ups'];
  const colWidths = [90, 100, 70, 70, 70, 70, 50];
  let xPos = margin;
  
  contentLines.push(`BT /F1 9 Tf`);
  headers.forEach((header, i) => {
    contentLines.push(`${xPos} ${yPos} Td (${escapeForPDF(header)}) Tj`);
    xPos += colWidths[i];
  });
  contentLines.push(`ET`);
  yPos -= lineHeight + 5;
  
  // Draw line
  contentLines.push(`${margin} ${yPos + 5} m ${pageWidth - margin} ${yPos + 5} l S`);
  yPos -= 5;
  
  // Data rows
  applications.forEach((app) => {
    if (yPos < 50) {
      yPos = 750; // New page would be needed, but for simplicity we'll just continue
    }
    
    const row = [
      truncate(app.company, 15),
      truncate(app.role, 18),
      truncate(app.platform || '-', 12),
      app.status,
      app.applied_date,
      app.deadline_date || '-',
      String(app.follow_up_count || 0),
    ];
    
    xPos = margin;
    contentLines.push(`BT /F1 8 Tf`);
    row.forEach((cell, i) => {
      contentLines.push(`${xPos} ${yPos} Td (${escapeForPDF(cell)}) Tj`);
      xPos += colWidths[i];
    });
    contentLines.push(`ET`);
    yPos -= lineHeight;
  });
  
  // Summary
  yPos -= 20;
  contentLines.push(`BT /F1 10 Tf ${margin} ${yPos} Td (Total Applications: ${applications.length}) Tj ET`);
  
  const contentStream = contentLines.join('\n');
  
  // Build PDF
  addObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  addObject('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  addObject(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`);
  addObject(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj`);
  addObject('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  
  // Calculate offsets
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj.split('\n').slice(1).join('\n')}\n`;
  });
  
  // Rebuild with correct structure
  pdf = '%PDF-1.4\n';
  const xrefOffset = pdf.length;
  
  objects.forEach((obj) => {
    pdf += obj + '\n';
  });
  
  const startxref = pdf.length;
  pdf += `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  
  let currentOffset = 9; // After %PDF-1.4\n
  objects.forEach((obj) => {
    pdf += `${String(currentOffset).padStart(10, '0')} 00000 n \n`;
    currentOffset += obj.length + 1;
  });
  
  pdf += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;

  return new Response(pdf, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  });
}

function escapeForPDF(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 2) + '..';
}
