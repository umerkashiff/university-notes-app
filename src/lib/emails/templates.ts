import { wrapEmailLayout } from './layout';

// 1. Account Approved (To Student)
export function accountApprovedEmail(options: {
  name?: string | null;
  role: string;
  semester: number;
}) {
  const firstName = options.name ? options.name.split(' ')[0] : 'Student';
  const roleLabel = options.role === 'SENIOR' ? 'Note Contributor' : 'Student';

  const contentHtml = `
    <p style="margin: 0 0 14px 0;">
      Hello <strong>${firstName}</strong>,
    </p>
    <p style="margin: 0 0 14px 0;">
      Great news! Department administrators have verified your registration details and approved your account for <strong>Semester ${options.semester}</strong>.
    </p>
    <p style="margin: 0;">
      Your access to the curated lecture repository, verified course notes, past exams, and academic calendar is now fully active.
    </p>
  `;

  const secondaryInfoHtml = `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding: 3px 0; color: #787a80;">Enrolled Cohort:</td>
        <td align="right" style="font-weight: 700; color: #252629;">Semester ${options.semester}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; color: #787a80;">Portal Role:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${roleLabel}</td>
      </tr>
    </table>
  `;

  return {
    subject: `Welcome to Semstack — Your account has been activated!`,
    html: wrapEmailLayout({
      previewText: `Your Semstack account for Semester ${options.semester} has been approved. Start browsing your courses now.`,
      title: `Your account is active and ready`,
      badge: { text: `Approved · Semester ${options.semester}`, bg: '#d8e2dc', color: '#1e3328' },
      contentHtml,
      secondaryInfoHtml,
      ctaButton: { text: 'Open Semstack Library', url: '/' }
    })
  };
}

// 2. Account Rejected (To Student)
export function accountRejectedEmail(options: {
  name?: string | null;
  reason?: string | null;
}) {
  const firstName = options.name ? options.name.split(' ')[0] : 'Applicant';
  const reasonText = options.reason?.trim() || 'Your registration details could not be matched against current department student rosters.';

  const contentHtml = `
    <p style="margin: 0 0 14px 0;">
      Hello <strong>${firstName}</strong>,
    </p>
    <p style="margin: 0 0 14px 0;">
      Thank you for your application to join Semstack. After review by department administrators, your registration could not be approved at this time.
    </p>
    <p style="margin: 0;">
      If you believe this was an error, please reach out to your department coordinator with your official student registration details.
    </p>
  `;

  const secondaryInfoHtml = `
    <div style="font-weight: 700; color: #dc2626; margin-bottom: 4px;">Reason for decision:</div>
    <div style="color: #43454b; font-style: italic;">"${reasonText}"</div>
  `;

  return {
    subject: `Semstack — Account application update`,
    html: wrapEmailLayout({
      previewText: `Update regarding your Semstack account application.`,
      title: `Account application update`,
      badge: { text: `Application Review`, bg: '#ead8d3', color: '#3a2522' },
      contentHtml,
      secondaryInfoHtml,
    })
  };
}

// 3. Role Promoted (To Contributor)
export function rolePromotedEmail(options: {
  name?: string | null;
  newRole: string;
}) {
  const firstName = options.name ? options.name.split(' ')[0] : 'Student';

  const contentHtml = `
    <p style="margin: 0 0 14px 0;">
      Congratulations <strong>${firstName}</strong>,
    </p>
    <p style="margin: 0 0 14px 0;">
      You have been granted <strong>Note Contributor (Senior)</strong> status by department administrators!
    </p>
    <p style="margin: 0;">
      You can now upload lecture slides, handwritten notes, exam solutions, and study guides for courses up to your current semester.
    </p>
  `;

  return {
    subject: `🌟 You've been promoted to Note Contributor on Semstack!`,
    html: wrapEmailLayout({
      previewText: `You now have contributor privileges to upload notes on Semstack.`,
      title: `You are now a Note Contributor`,
      badge: { text: `Contributor Access`, bg: '#dce3ec', color: '#1d2c3c' },
      contentHtml,
      ctaButton: { text: 'Upload Lecture Notes', url: '/' }
    })
  };
}

// 4. Note Published (To Contributor Author)
export function notePublishedEmail(options: {
  authorName?: string | null;
  noteTitle: string;
  subjectName: string;
  subjectCode: string;
}) {
  const firstName = options.authorName ? options.authorName.split(' ')[0] : 'Contributor';

  const contentHtml = `
    <p style="margin: 0 0 14px 0;">
      Hello <strong>${firstName}</strong>,
    </p>
    <p style="margin: 0 0 14px 0;">
      Your submitted notes for <strong>${options.subjectName} (${options.subjectCode})</strong> have been reviewed and officially published to the department library!
    </p>
    <p style="margin: 0;">
      Students across your cohort can now read, search, and download your study material. Thank you for supporting your peers.
    </p>
  `;

  const secondaryInfoHtml = `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding: 3px 0; color: #787a80;">Document:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${options.noteTitle}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; color: #787a80;">Course:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${options.subjectCode}</td>
      </tr>
    </table>
  `;

  return {
    subject: `🎉 Your note "${options.noteTitle}" is now live!`,
    html: wrapEmailLayout({
      previewText: `Your notes for ${options.subjectCode} are now published and visible to all students.`,
      title: `Your notes are live on Semstack`,
      badge: { text: `Published`, bg: '#d8e2dc', color: '#1e3328' },
      contentHtml,
      secondaryInfoHtml,
      ctaButton: { text: 'View in Library', url: '/' }
    })
  };
}

// 5. Note Rejected (To Contributor Author)
export function noteRejectedEmail(options: {
  authorName?: string | null;
  noteTitle: string;
  subjectCode?: string | null;
  reason?: string | null;
}) {
  const firstName = options.authorName ? options.authorName.split(' ')[0] : 'Contributor';
  const reasonText = options.reason?.trim() || 'The uploaded file did not meet quality or curriculum alignment guidelines.';

  const contentHtml = `
    <p style="margin: 0 0 14px 0;">
      Hello <strong>${firstName}</strong>,
    </p>
    <p style="margin: 0 0 14px 0;">
      Thank you for submitting <strong>"${options.noteTitle}"</strong>${options.subjectCode ? ` for <strong>${options.subjectCode}</strong>` : ''}.
    </p>
    <p style="margin: 0 0 14px 0;">
      During review, administrators were unable to approve this upload into the library.
    </p>
    <p style="margin: 0;">
      You are welcome to re-upload a revised or clearer scan anytime.
    </p>
  `;

  const secondaryInfoHtml = `
    <div style="font-weight: 700; color: #dc2626; margin-bottom: 4px;">Feedback / Reason:</div>
    <div style="color: #43454b; font-style: italic;">"${reasonText}"</div>
  `;

  return {
    subject: `Semstack — Note review update for "${options.noteTitle}"`,
    html: wrapEmailLayout({
      previewText: `Review feedback regarding your note submission "${options.noteTitle}".`,
      title: `Submission Review Update`,
      badge: { text: `Review Notice`, bg: '#ead8d3', color: '#3a2522' },
      contentHtml,
      secondaryInfoHtml,
      ctaButton: { text: 'Open Contributor Portal', url: '/' }
    })
  };
}

// 6. Semester Advanced (To Advancing Students)
export function semesterAdvancedEmail(options: {
  name?: string | null;
  fromSem: number;
  toSem: number;
  periodName?: string;
}) {
  const firstName = options.name ? options.name.split(' ')[0] : 'Student';

  const contentHtml = `
    <p style="margin: 0 0 14px 0;">
      Welcome to a new academic chapter, <strong>${firstName}</strong>!
    </p>
    <p style="margin: 0 0 14px 0;">
      Department semester advancement has concluded. Your study portal has been successfully transitioned from <strong>Semester ${options.fromSem}</strong> to <strong>Semester ${options.toSem}</strong>.
    </p>
    <p style="margin: 0;">
      Your new course modules, lecture notes, textbook references, and past papers are now accessible on Semstack.
    </p>
  `;

  const secondaryInfoHtml = `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding: 3px 0; color: #787a80;">Academic Term:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${options.periodName || 'New Term'}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; color: #787a80;">Current Standing:</td>
        <td align="right" style="font-weight: 700; color: #252629;">Semester ${options.toSem}</td>
      </tr>
    </table>
  `;

  return {
    subject: `📚 Welcome to Semester ${options.toSem} — New courses unlocked!`,
    html: wrapEmailLayout({
      previewText: `Your Semstack portal has been updated for Semester ${options.toSem}. Explore your courses.`,
      title: `Welcome to Semester ${options.toSem}`,
      badge: { text: `Semester ${options.toSem}`, bg: '#dce3ec', color: '#1d2c3c' },
      contentHtml,
      secondaryInfoHtml,
      ctaButton: { text: `Explore Semester ${options.toSem} Courses`, url: '/' }
    })
  };
}

// 7. Graduated (To Senior Graduates)
export function graduatedEmail(options: {
  name?: string | null;
  batchYear?: number | null;
}) {
  const firstName = options.name ? options.name.split(' ')[0] : 'Graduate';

  const contentHtml = `
    <p style="margin: 0 0 14px 0;">
      Heartiest congratulations, <strong>Engr. ${firstName}</strong>!
    </p>
    <p style="margin: 0 0 14px 0;">
      You have successfully completed your 8 semesters of Computer Engineering at UET Lahore.
    </p>
    <p style="margin: 0 0 14px 0;">
      As an honored alumnus of the department, your Semstack account will remain permanently active with full access to all 8 semesters of curriculum materials.
    </p>
    <p style="margin: 0;">
      We wish you the very best in your professional engineering career!
    </p>
  `;

  return {
    subject: `🎓 Congratulations Batch ${options.batchYear || ''} Graduate!`,
    html: wrapEmailLayout({
      previewText: `Congratulations on graduating from UET Computer Engineering! Your alumni library access is permanently active.`,
      title: `Congratulations on your graduation!`,
      badge: { text: `Alumni · Batch ${options.batchYear || 'Graduate'}`, bg: '#f2e3cd', color: '#382c1e' },
      contentHtml,
      ctaButton: { text: 'Visit Semstack Alumni Portal', url: '/' }
    })
  };
}

// 8. Department Announcement (To Targeted Students)
export function departmentAnnouncementEmail(options: {
  title: string;
  body: string;
  audienceLabel: string;
  hasImage?: boolean;
}) {
  const formattedBody = options.body.replace(/\n/g, '<br/>');

  const contentHtml = `
    <div style="font-size: 15px; line-height: 1.7; color: #252629; margin-bottom: 20px;">
      ${formattedBody}
    </div>
    ${options.hasImage ? `
    <div style="margin-top: 20px; padding: 16px; background-color: #f7f5f2; border-radius: 16px; border: 1px solid #e8e4de; text-align: center;">
      <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #252629;">
        📎 Official Circular / Image Attached
      </p>
      <p style="margin: 0; font-size: 12px; color: #6f706f;">
        An official department document or schedule scan is attached to this notice.
      </p>
    </div>
    ` : ''}
  `;

  return {
    subject: `📢 [Department Notice] ${options.title}`,
    html: wrapEmailLayout({
      previewText: `${options.title} — Official Department Announcement.`,
      title: options.title,
      badge: { text: `Notice · ${options.audienceLabel}`, bg: '#252629', color: '#ffffff' },
      contentHtml,
      ctaButton: options.hasImage ? { text: 'Open Semstack to View Full Notice Image', url: '/' } : { text: 'View on Semstack', url: '/' }
    })
  };
}

// 9. New Registration Alert (To Department Admins)
export function newRegistrationAlertEmail(options: {
  name: string;
  regNumber: string;
  semester: number;
  isContributor: boolean;
  email: string;
  section?: string | null;
}) {
  const contentHtml = `
    <p style="margin: 0 0 14px 0;">
      A new student has submitted their registration for administrator approval:
    </p>
  `;

  const secondaryInfoHtml = `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding: 4px 0; color: #787a80;">Applicant Name:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${options.name}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #787a80;">Registration No:</td>
        <td align="right" style="font-weight: 700; color: #252629; font-family: monospace;">${options.regNumber}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #787a80;">Email Address:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${options.email}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #787a80;">Cohort:</td>
        <td align="right" style="font-weight: 700; color: #252629;">Semester ${options.semester} (${options.section || 'A'})</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #787a80;">Role Requested:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${options.isContributor ? '⭐ Note Contributor' : 'Student'}</td>
      </tr>
    </table>
  `;

  return {
    subject: `👤 New Registration: ${options.name} (${options.regNumber})`,
    html: wrapEmailLayout({
      previewText: `New registration pending: ${options.name} (${options.regNumber}, Semester ${options.semester}).`,
      title: `New Student Registration Pending`,
      badge: { text: `Action Required`, bg: '#fcdbd6', color: '#3a2220' },
      contentHtml,
      secondaryInfoHtml,
      ctaButton: { text: 'Review in Admin Panel', url: '/' }
    })
  };
}

// 10. Note Submitted Alert (To Department Admins)
export function noteSubmittedAlertEmail(options: {
  contributorName: string;
  noteTitle: string;
  subjectCode: string;
  pages: number;
  fileSize: string;
}) {
  const contentHtml = `
    <p style="margin: 0 0 14px 0;">
      A note contributor has uploaded new study material for review:
    </p>
  `;

  const secondaryInfoHtml = `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding: 4px 0; color: #787a80;">Note Title:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${options.noteTitle}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #787a80;">Course:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${options.subjectCode}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #787a80;">Uploaded By:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${options.contributorName}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #787a80;">Document Size:</td>
        <td align="right" style="font-weight: 700; color: #252629;">${options.pages} pages (${options.fileSize})</td>
      </tr>
    </table>
  `;

  return {
    subject: `📄 Note Submitted for Review: "${options.noteTitle}" (${options.subjectCode})`,
    html: wrapEmailLayout({
      previewText: `New note pending review: "${options.noteTitle}" by ${options.contributorName}.`,
      title: `New Note Submitted for Review`,
      badge: { text: `Review Queue`, bg: '#dce3ec', color: '#1d2c3c' },
      contentHtml,
      secondaryInfoHtml,
      ctaButton: { text: 'Open Review Queue', url: '/' }
    })
  };
}

// 12. Password Reset Verification Code (To User)
export function passwordResetEmail(options: {
  name?: string | null;
  code: string;
}) {
  const firstName = options.name ? options.name.split(' ')[0] : 'Student';

  const contentHtml = `
    <p style="margin: 0 0 14px 0;">
      Hello <strong>${firstName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0;">
      We received a request to reset the password for your Semstack account. Use the 6-digit verification code below to set a new password:
    </p>
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 20px auto 20px auto; border-collapse: separate; border-spacing: 0;">
      <tr>
        <td align="center" style="background-color: #f0ede6; border-radius: 16px; padding: 14px 28px; border: 1px solid #e2ddd5;">
          <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 30px; font-weight: 800; letter-spacing: 8px; color: #252629; display: inline-block;">
            ${options.code}
          </span>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 10px 0; font-size: 13px; color: #787a80; text-align: center;">
      This verification code is valid for the next <strong>15 minutes</strong>.
    </p>
    <p style="margin: 20px 0 0 0; font-size: 12px; color: #94969c; line-height: 1.5;">
      If you did not request a password reset, please ignore this email or contact department coordinators. Your existing password remains unchanged.
    </p>
  `;

  return {
    subject: `🔐 Your Semstack Password Reset Code: ${options.code}`,
    html: wrapEmailLayout({
      previewText: `Use verification code ${options.code} to reset your Semstack account password.`,
      title: `Reset Your Password`,
      badge: { text: `Security`, bg: '#ece8e1', color: '#3d3f44' },
      contentHtml
    })
  };
}

