import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendDefectAlert(params: {
  managerEmail: string;
  driverName: string;
  vehicleReg: string;
  defectDescription: string;
  severity: string;
  companyName: string;
}): Promise<{ success: boolean; error?: string }> {
  const severityColor = params.severity === 'critical' ? '#dc2626' : params.severity === 'major' ? '#f59e0b' : '#3b82f6';
  
  return sendEmail({
    to: params.managerEmail,
    subject: `⚠️ ${params.severity.toUpperCase()} Defect Reported - ${params.vehicleReg}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚛 Titan Fleet</h1>
          <p style="color: #94a3b8; margin: 8px 0 0 0;">${params.companyName}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="background: ${severityColor}; color: white; padding: 8px 16px; border-radius: 6px; display: inline-block; font-weight: bold; margin-bottom: 16px;">
            ${params.severity.toUpperCase()} DEFECT
          </div>
          
          <h2 style="color: #1e293b; margin: 0 0 16px 0;">Vehicle: ${params.vehicleReg}</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Reported by:</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${params.driverName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Description:</td>
              <td style="padding: 8px 0; color: #1e293b;">${params.defectDescription}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Time:</td>
              <td style="padding: 8px 0; color: #1e293b;">${new Date().toLocaleString('en-GB')}</td>
            </tr>
          </table>
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
              View in Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #1e293b; padding: 16px 24px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">
            Titan Fleet Management • Automated Notification
          </p>
        </div>
      </div>
    `
  });
}

export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  companyName: string;
  companyCode: string;
  pin: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: params.email,
    subject: `Welcome to ${params.companyName} - Your Titan Fleet Login`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚛 Titan Fleet</h1>
          <p style="color: #94a3b8; margin: 8px 0 0 0;">${params.companyName}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="color: #1e293b; margin: 0 0 16px 0;">Welcome, ${params.name}!</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            You've been added to ${params.companyName}'s fleet management system. 
            Use the details below to log in to the Titan Fleet app.
          </p>
          
          <div style="background: white; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #1e293b; margin: 0 0 16px 0;">Your Login Details</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Company Code:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: bold; font-size: 18px;">${params.companyCode}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Your PIN:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: bold; font-size: 18px;">${params.pin}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            ⚠️ Keep your PIN secure and don't share it with others.
          </p>
        </div>
        
        <div style="background: #1e293b; padding: 16px 24px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">
            Titan Fleet Management
          </p>
        </div>
      </div>
    `
  });
}

export async function sendTimesheetSummary(params: {
  email: string;
  name: string;
  companyName: string;
  weekEnding: string;
  totalHours: number;
  shifts: Array<{ date: string; hours: number; depot: string }>;
}): Promise<{ success: boolean; error?: string }> {
  const shiftsHtml = params.shifts.map(s => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${s.date}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${s.depot}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${s.hours.toFixed(1)}h</td>
    </tr>
  `).join('');

  return sendEmail({
    to: params.email,
    subject: `Weekly Timesheet Summary - W/E ${params.weekEnding}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚛 Titan Fleet</h1>
          <p style="color: #94a3b8; margin: 8px 0 0 0;">${params.companyName}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="color: #1e293b; margin: 0 0 8px 0;">Hi ${params.name},</h2>
          <p style="color: #475569; margin: 0 0 24px 0;">
            Here's your timesheet summary for the week ending ${params.weekEnding}
          </p>
          
          <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 36px; font-weight: bold;">${params.totalHours.toFixed(1)}</div>
            <div style="font-size: 14px; opacity: 0.9;">Total Hours</div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 12px; text-align: left; color: #64748b; font-weight: 500;">Date</th>
                <th style="padding: 12px; text-align: left; color: #64748b; font-weight: 500;">Depot</th>
                <th style="padding: 12px; text-align: left; color: #64748b; font-weight: 500;">Hours</th>
              </tr>
            </thead>
            <tbody>
              ${shiftsHtml}
            </tbody>
          </table>
        </div>
        
        <div style="background: #1e293b; padding: 16px 24px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">
            Titan Fleet Management • Automated Timesheet Summary
          </p>
        </div>
      </div>
    `
  });
}
