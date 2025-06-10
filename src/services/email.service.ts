import emailjs from '@emailjs/nodejs';
import { HttpException, Injectable, Logger } from '@nestjs/common';

const SERVICE_ID = 'service_7c9h1g8';
const TEMPLATE_ENROLLMENT_ID = 'template_warjsk8';
const TEMPLATE_ASSISTANT_ID = 'template_tnztalm';
const PUBLIC_KEY = 'hKz0YVFI0a8LaRhc7'
const KEYS = { privateKey: process.env.EMAIL_PRIVATE_KEY, publicKey: PUBLIC_KEY };

@Injectable()
export class EmailService {
  constructor() { }

  /**
    * Sends an enrollment email with the given data.
    *
    * @param toName       - The name of the user to receive the email.
    * @param courseName   - The name of the course that the user is getting enrolled.
    * @param studentEmail - The email of the user.
    *
    * @throws {HttpException} - If there was an error with the email broker.
    */
  async sendEnrollmentEmail(toName: string, courseName: string, studentEmail: string) {
    const templateParams = {
      to_name: toName,
      course_name: courseName,
      student_email: studentEmail
    };

    try {
      const result = await emailjs.send(SERVICE_ID, TEMPLATE_ENROLLMENT_ID, templateParams, KEYS);
      logger.log('✅ Enrollment email sent:', result.status);
    } catch (err) {
      logger.error('❌ Error sending enrollment email:', err);
      throw new HttpException(`Error sending enrollment email: ${err}`, 500)
    }
  }

  /**
    * Sends an enrollment email with the given data.
    *
    * @param toName        - The name of the user to receive the email.
    * @param professorName - The name of the professor of the course.
    * @param courseName    - The name of the course that the user is getting enrolled.
    * @param studentEmail  - The email of the user.
    *
    * @throws {HttpException} - If there was an error with the email broker.
    */
  async sendAssistantAssignmentEmail(
    toName: string,
    professorName: string,
    courseName: string,
    studentEmail: string
  ) {
    const templateParams = {
      to_name: toName,
      professor_name: professorName,
      course_name: courseName,
      student_email: studentEmail
    };

    try {
      const result = await emailjs.send(SERVICE_ID, TEMPLATE_ASSISTANT_ID, templateParams, KEYS);
      logger.log('✅ Assistant assignment email sent:', result.status);
    } catch (err) {
      logger.error('❌ Error sending assistant assignment email:', err);
      throw new HttpException(`Error sending assistant assignment email: ${err}`, 500)
    }
  }

  async sendNewRulesEmail(
    toName: string,
    toEmail: string,
    rules: any[],
  ) {
    const body = "";
    const templateParams = {
      to_name: toName,
      to_email: toEmail,
      body: body,
    }

    try {
      const result = await emailjs.send(SERVICE_ID, TEMPLATE_ASSISTANT_ID, templateParams, KEYS);
      logger.log('✅ New rules email sent:', result.status);
    } catch (err) {
      logger.error('❌ Error sending new rules email:', err);
      throw new HttpException(`Error sending new rules email: ${err}`, 500);
    }
  }
}

const logger = new Logger(EmailService.name);
