import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host  : process.env.SMTP_HOST || 'smtp.gmail.com',
  port  : Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth  : {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Design tokens (mirrors the frontend CSS vars) ──────────────────────────
const C = {
  accent      : '#16a34a',
  accentDark  : '#15803d',
  accentLight : '#4ade80',
  accentBg    : '#f0fdf4',
  canvas      : '#f8fffa',
  surface     : '#ffffff',
  border      : '#d1fae5',
  fg          : '#0f1f0f',
  fgMuted     : '#4b5563',
  fgSubtle    : '#9ca3af',
  onAccent    : '#ffffff',
  footerBg    : '#f0fdf4',
  footerFg    : '#0f1f0f',
  footerMuted : '#4b5563',
  footerSubtle: '#9ca3af',
};

const BRAND_NAME    = 'SchoolFlow';
const POWERED_BY    = 'Beetallab';
const BRAND_URL     = process.env.FRONTEND_URL || 'http://localhost:3000';
const POWERED_URL   = 'https://beetallab.com';

// ── Base layout ────────────────────────────────────────────────────────────
function baseTemplate(opts: {
  previewText : string;
  body        : string;
  footerNote ?: string;
}): string {
  const { previewText, body, footerNote } = opts;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    *{box-sizing:border-box}
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse}
    img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;display:block}
    body{margin:0!important;padding:0!important;background-color:${C.canvas}}
    @media only screen and (max-width:620px){
      .wrapper{padding:20px 12px!important}
      .card{padding:32px 20px!important;border-radius:20px!important}
      .btn-wrap{width:100%!important}
      .btn-cta{width:100%!important;display:block!important;text-align:center!important;padding:14px 20px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.canvas};">

  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:${C.canvas};">
    ${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:44px 16px 36px;" class="wrapper">
        <table role="presentation" width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

          <!-- ── Logo bar ─────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:${C.surface};border:1.5px solid ${C.border};border-radius:16px;padding:11px 22px;box-shadow:0 2px 8px rgba(22,163,74,0.08);">
                    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:19px;font-weight:800;color:${C.accent};letter-spacing:-0.4px;">
                      &#127979;&nbsp;${BRAND_NAME}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Card ────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:${C.surface};border:1.5px solid ${C.border};border-radius:24px;padding:44px 40px;box-shadow:0 4px 20px rgba(22,163,74,0.07),0 1px 4px rgba(0,0,0,0.03);" class="card">
              ${body}
            </td>
          </tr>

          <!-- ── Footer ───────────────────────────────────────────── -->
          <tr>
            <td style="padding:20px 8px 0;text-align:center;">
              ${footerNote
                ? `<p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:${C.footerMuted};line-height:1.6;">${footerNote}</p>`
                : ''}
              <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:${C.footerSubtle};line-height:1.7;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME} &mdash; School Management System<br/>
                This is an automated message &mdash; please do not reply.
              </p>
              <p style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;color:${C.footerSubtle};">
                Powered by&nbsp;<a href="${POWERED_URL}" target="_blank" style="color:${C.accent};text-decoration:none;font-weight:600;">${POWERED_BY}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── UI helpers ─────────────────────────────────────────────────────────────

function heading(text: string, emoji = ''): string {
  return `
    <h1 style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:26px;font-weight:800;color:${C.fg};letter-spacing:-0.6px;line-height:1.25;">
      ${emoji ? `<span style="margin-right:8px;">${emoji}</span>` : ''}${text}
    </h1>`;
}

function subtext(html: string): string {
  return `
    <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;color:${C.fgMuted};line-height:1.75;">
      ${html}
    </p>`;
}

function ctaButton(label: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" class="btn-wrap">
      <tr>
        <td style="border-radius:12px;background-color:${C.accent};box-shadow:0 4px 14px rgba(22,163,74,0.28);">
          <a href="${url}" target="_blank" class="btn-cta"
             style="display:inline-block;padding:14px 34px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:700;color:${C.onAccent};text-decoration:none;border-radius:12px;letter-spacing:0.1px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function softDivider(): string {
  return `<div style="height:1px;background-color:${C.border};margin:28px 0;"></div>`;
}

function infoBox(rows: { label: string; value: string }[]): string {
  const items = rows.map(({ label, value }) => `
    <tr>
      <td style="padding:12px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:${C.fgSubtle};text-transform:uppercase;letter-spacing:0.7px;white-space:nowrap;border-bottom:1px solid ${C.border};width:1%;vertical-align:middle;">
        ${label}
      </td>
      <td style="padding:12px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:500;color:${C.fg};border-bottom:1px solid ${C.border};word-break:break-all;vertical-align:middle;">
        ${value}
      </td>
    </tr>`).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:${C.accentBg};border:1.5px solid ${C.border};border-radius:14px;overflow:hidden;">
      <tbody>${items}</tbody>
    </table>`;
}

function alertBox(type: 'warning' | 'danger' | 'success', html: string): string {
  const map = {
    warning : { bg: '#fffbeb', border: '#fde68a', color: '#78350f', icon: '&#9888;&#65039;' },
    danger  : { bg: '#fff1f2', border: '#fecdd3', color: '#9f1239', icon: '&#128274;'        },
    success : { bg: C.accentBg, border: C.border,  color: C.accentDark, icon: '&#10003;'    },
  }[type];

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:${map.bg};border:1.5px solid ${map.border};border-radius:12px;">
      <tr>
        <td style="padding:14px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13.5px;color:${map.color};line-height:1.65;">
          ${map.icon}&nbsp; ${html}
        </td>
      </tr>
    </table>`;
}

function checkList(items: string[]): string {
  const rows = items.map(item => `
    <tr>
      <td style="padding:5px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:${C.fgMuted};line-height:1.65;">
        <span style="display:inline-block;width:20px;color:${C.accent};font-weight:800;">&#10003;</span>${item}
      </td>
    </tr>`).join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px;width:100%;">${rows}</table>`;
}

function fallbackLink(url: string): string {
  return `
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:${C.fgSubtle};line-height:1.7;">
      Button not working? Copy &amp; paste this link into your browser:<br/>
      <a href="${url}" style="color:${C.accent};word-break:break-all;">${url}</a>
    </p>`;
}

// ── 1. Password Reset ──────────────────────────────────────────────────────
export const sendPasswordResetEmail = async (to: string, resetUrl: string): Promise<void> => {
  const body = `
    ${heading('Reset your password', '&#128274;')}
    ${subtext(`We received a request to reset the password for your <strong style="color:${C.fg};">${BRAND_NAME}</strong> account. Click the button below &mdash; this link expires in <strong style="color:${C.fg};">15 minutes</strong>.`)}

    ${ctaButton('Reset My Password &nbsp;&#8594;', resetUrl)}

    <div style="margin-top:24px;">
      ${alertBox('warning', `<strong>Didn't request this?</strong> You can safely ignore this email. Your password won't change and the link will expire automatically.`)}
    </div>

    ${softDivider()}
    ${fallbackLink(resetUrl)}`;

  await transporter.sendMail({
    from   : `"${BRAND_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Reset your ${BRAND_NAME} password`,
    html   : baseTemplate({
      previewText: 'Reset your password — link expires in 15 minutes.',
      body,
      footerNote : `This reset was requested for the account linked to ${to}.`,
    }),
  });
};

// ── 2. Student / Teacher credentials ──────────────────────────────────────
export const sendCredentialsEmail = async (opts: {
  to          : string;
  name        : string;
  role        : 'student' | 'teacher' | 'management';
  username    : string;
  tempPassword: string;
  schoolName  : string;
}): Promise<void> => {
  const { to, name, role, username, tempPassword, schoolName } = opts;
  const loginUrl  = `${BRAND_URL}/login`;
  const roleLabel = role === 'student' ? 'Student' : role === 'teacher' ? 'Teacher' : 'Staff';

  const body = `
    ${heading(`Welcome to ${schoolName}`, '&#127881;')}
    ${subtext(`Hi <strong style="color:${C.fg};">${name}</strong>, your ${BRAND_NAME} <strong style="color:${C.fg};">${roleLabel}</strong> account is ready. Sign in with the credentials below.`)}

    ${infoBox([
      { label: 'Portal',    value: `<a href="${loginUrl}" style="color:${C.accent};font-weight:600;">${BRAND_URL}/login</a>` },
      { label: 'Username',  value: `<code style="background:${C.surface};border:1px solid ${C.border};padding:2px 8px;border-radius:6px;font-size:13px;color:${C.fg};">${username}</code>` },
      { label: 'Password',  value: `<code style="background:${C.surface};border:1px solid ${C.border};padding:2px 8px;border-radius:6px;font-size:13px;color:${C.fg};">${tempPassword}</code>` },
    ])}

    <div style="margin-top:28px;">${ctaButton('Sign In Now &nbsp;&#8594;', loginUrl)}</div>

    <div style="margin-top:20px;">
      ${alertBox('danger', `<strong>Important:</strong> This is a temporary password. Please change it immediately after your first login. Never share your credentials with anyone.`)}
    </div>`;

  await transporter.sendMail({
    from   : `"${BRAND_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your ${BRAND_NAME} account is ready — ${schoolName}`,
    html   : baseTemplate({
      previewText: `Your ${roleLabel} account for ${schoolName} is ready. Sign in now.`,
      body,
      footerNote : `This account was created by ${schoolName} via ${BRAND_NAME}.`,
    }),
  });
};

// ── 3. School onboarding welcome ───────────────────────────────────────────
export const sendWelcomeEmail = async (opts: {
  to        : string;
  name      : string;
  schoolName: string;
  schoolCode: string;
}): Promise<void> => {
  const { to, name, schoolName, schoolCode } = opts;
  const dashboardUrl = `${BRAND_URL}/dashboard`;

  const body = `
    ${heading(`You're all set, ${name}!`, '&#127881;')}
    ${subtext(`<strong style="color:${C.fg};">${schoolName}</strong> is now live on ${BRAND_NAME}. Your dashboard is ready — here's what to do next.`)}

    ${infoBox([
      { label: 'School',    value: schoolName },
      { label: 'Code',      value: `<code style="background:${C.surface};border:1px solid ${C.border};padding:2px 8px;border-radius:6px;font-size:13px;color:${C.fg};">${schoolCode}</code>` },
      { label: 'Dashboard', value: `<a href="${dashboardUrl}" style="color:${C.accent};font-weight:600;">${dashboardUrl}</a>` },
    ])}

    <div style="margin-top:28px;">${ctaButton('Open Dashboard &nbsp;&#8594;', dashboardUrl)}</div>

    ${softDivider()}

    <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;font-weight:700;color:${C.fgSubtle};text-transform:uppercase;letter-spacing:0.8px;">
      Suggested next steps
    </p>
    ${checkList([
      'Upload your school logo and set your brand colors',
      'Create classes and assign subjects',
      'Add teachers and send them their login credentials',
      'Register students and generate admission numbers',
      'Set up fee structures and exam schedules',
    ])}`;

  await transporter.sendMail({
    from   : `"${BRAND_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject: `${schoolName} is live on ${BRAND_NAME} &#127979;`,
    html   : baseTemplate({
      previewText: `${schoolName} is ready on ${BRAND_NAME}. Open your dashboard and get started.`,
      body,
      footerNote : `You registered ${schoolName} on ${BRAND_NAME}. This is your confirmation.`,
    }),
  });
};
