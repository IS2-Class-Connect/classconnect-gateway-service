import emailjs from '@emailjs/nodejs';
import { HttpException } from '@nestjs/common';

const SERVICE_ID = 'service_7c9h1g8';
const TEMPLATE_ENROLLMENT_ID = 'template_warjsk8';
const TEMPLATE_ASSISTANT_ID = 'template_tnztalm';
const PUBLIC_KEY = 'hKz0YVFI0a8LaRhc7'
const KEYS = { privateKey: process.env.EMAIL_PRIVATE_KEY, publicKey: PUBLIC_KEY };

export async function sendEnrollmentEmail(toName: string, courseName: string, studentEmail: string) {
  const templateParams = { to_name: toName, course_name: courseName, student_email: studentEmail };

  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ENROLLMENT_ID, templateParams, KEYS);
    console.log('✅ Enrollment email sent:', result.status);
  } catch (err) {
    console.error('❌ Error sending enrollment email:', err);
    throw new HttpException(`Error sending enrollment email: ${err}`, 500)
  }
}

export async function sendAssistantAssignmentEmail(
  toName: string,
  professorName: string,
  courseName: string,
  studentEmail: string
) {
  const templateParams = { to_name: toName, professor_name: professorName, course_name: courseName, student_email: studentEmail };

  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ASSISTANT_ID, templateParams, KEYS);
    console.log('✅ Assistant assignment email sent:', result.status);
  } catch (err) {
    console.error('❌ Error sending assistant assignment email:', err);
    throw new HttpException(`Error sending assistant assignment email: ${err}`, 500)
  }
}
