import emailjs from '@emailjs/nodejs';
import { HttpException, Injectable, Logger } from '@nestjs/common';

export const SERVICE_ID = 'service_7c9h1g8';
export const TEMPLATE_EMAIL_ID = 'template_tnztalm';
export const PUBLIC_KEY = 'hKz0YVFI0a8LaRhc7'
export const KEYS = { privateKey: process.env.EMAIL_PRIVATE_KEY, publicKey: PUBLIC_KEY };

@Injectable()
export class EmailService {
  constructor() { }

  /**
   * Generates the HTML content for the enrollment confirmation email.
   *
   * @param courseName - The name of the course the user is enrolled in.
   * @returns The HTML string content of the email.
   */
  enrollmentTemplate(courseName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>You have been successfully enrolled in the course <strong>"${courseName}"</strong>.</p>
        <p>We wish you a productive and enriching learning experience.</p>
      </div>
    `;
  }

  /**
   * Generates the HTML content for the teaching assistant assignment email.
   *
   * @param courseName - The name of the course for which the assignment is made.
   * @param professorName - The name of the professor assigning the assistant.
   * @returns The HTML string content of the email.
   */
  assistantAssignmentTemplate(courseName: string, professorName: string): string {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>You have been assigned as a <strong>teaching assistant</strong> for the course 
      <strong>"${courseName}"</strong> by Professor <strong>${professorName}</strong>.</p>
      <p>Thank you for your support and collaboration. We look forward to the positive impact you'll make.</p>
    </div>
  `;
  }


  /**
   * Generates the HTML content for the "New Rules and Policies" email.
   *
   * @param rules                        - An array of rule objects, each containing:
   *   - title: string                   - The title of the rule.
   *   - description: string             - The detailed description of the rule.
   *   - effective_date: string          - The date when the rule becomes effective.
   *   - applicable_conditions: string[] - List of conditions under which the rule applies.
   * 
   * @returns The HTML string content of the email listing all the updated rules.
   */
  newRulesTemplate(rules: any[]): string {
    const ruleStrings: string[] = [];
    for (let i = 0; i < rules.length; i++) {
      const title: string = rules[i].title;
      const description: string = rules[i].description;
      const effectiveDate: string = rules[i].effective_date;
      const applicableConditions: string[] = rules[i].applicable_conditions;

      const conditionsList = applicableConditions.map(condition =>
        `<li>${condition}</li>`
      ).join("");

      const ruleHtml = `
        <li style="margin-bottom: 1em;">
          <strong>${title}</strong> <em>(${effectiveDate})</em><br />
          <p>${description}</p>
          <p><strong>This rule applies under the following conditions:</strong></p>
          <ul>
            ${conditionsList}
          </ul>
        </li>
      `;

      ruleStrings.push(ruleHtml);
    }

    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>The rules and policies of the site have changed. Below are the updated rules:</p>
      <ul>
        ${ruleStrings.join("\n")}
      </ul>
    </div>`;
  }

  /**
    * Sends an email with the given data.
    *
    * @param toName  - The name of the user to receive the email.
    * @param toEmail - The name of the professor of the course.
    * @param subject - The subject of the email.
    * @param body    - The main text of the email.
    *
    * @throws {HttpException} - If there was an error with the email broker.
    */
  private async sendEmail(toName: string, toEmail: string, subject: string, body: string) {
    const templateParams = {
      toName,
      toEmail,
      subject,
      body,
    };

    try {
      const result = await emailjs.send(SERVICE_ID, TEMPLATE_EMAIL_ID, templateParams, KEYS);
      logger.log(`✅ Email with subject ${subject} sent:`, result.status);
    } catch (err) {
      logger.error(`❌ Error sending email with subject "${subject}":`, err);
      throw new HttpException(`Error sending email with subject "${subject}": ${err}`, 500)
    }
  }

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
    const subject = `Enrollment Confirmation - ${courseName}`;
    const body = this.enrollmentTemplate(courseName);
    await this.sendEmail(toName, studentEmail, subject, body);
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
    const subject = `Assistant Assignment - ${courseName}`;
    const body = this.assistantAssignmentTemplate(courseName, professorName);
    await this.sendEmail(toName, studentEmail, subject, body);
  }

  /**
    * Sends a new rules and policies email with the given data.
    *
    * @param toName  - The name of the user to receive the email.
    * @param toEmail - The name of the professor of the course.
    * @param rules   - The new rules and policies.
    *
    * @throws {HttpException} - If there was an error with the email broker.
    */
  async sendNewRulesEmail(
    toName: string,
    toEmail: string,
    rules: any[],
  ) {
    const subject = "New Rules and Policies";
    const body = this.newRulesTemplate(rules);
    await this.sendEmail(toName, toEmail, subject, body);
  }
}

const logger = new Logger(EmailService.name);
