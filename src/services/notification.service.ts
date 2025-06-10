import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { EmailService } from "./email.service";
import { PushService } from "./push.service";

@Injectable()
export class NotificationService {
  constructor(
    private readonly push: PushService,
    private readonly mail: EmailService,
  ) { }

  /**
    * Checks if the notification should be notified checking their configuration.
    *
    * @param user  - The user's data containing the configuration.
    * @param topic - The type of notification the user should receive.
    *
    * @throws {HttpException} - If the user should be notified with a related message to return if they chose not to.
    */
  validateUserConfig(user: any, topic: string) {
    const {
      pushTaskAssignment,
      pushMessageReceived,
      pushDeadlineReminder,
      emailEnrollment,
      emailAssistantAssignment,
    } = user;

    if (topic == 'task-assignment' && !pushTaskAssignment) {
      throw new HttpException('user has task assignment silenced', HttpStatus.OK);
    } else if (topic == 'message-received' && !pushMessageReceived) {
      throw new HttpException('user has new messages silenced', HttpStatus.OK);
    } else if (topic == 'deadline-reminder' && !pushDeadlineReminder) {
      throw new HttpException('user has deadline reminders silenced', HttpStatus.OK);
    } else if (topic == 'enrollment' && !emailEnrollment) {
      throw new HttpException('user has enrollment silenced', HttpStatus.OK);
    } else if (topic == 'assistant-assignment' && !emailAssistantAssignment) {
      throw new HttpException('user has assistant assignments silenced', HttpStatus.OK);
    }
  }

  /**
    * Sends a push notification to the user.
    *
    * @param user  - The user's information.
    * @param title - The title the user will see in their notification.
    * @param body  - The body the user will see in their notification.
    * @param topic - The kind of notification they will receive.
    *
    * @throws {HttpException} If the user's configuration specifies to not receive notifications related to topic or the pushToken is invalid.
    */
  async notifyUser(user: any, title: string, body: string, topic: string) {
    this.validateUserConfig(user, topic);

    const { uuid, pushToken } = user;
    if (!pushToken) {
      throw new HttpException("Received invalid data from users service", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    await this.push.notifyUser(pushToken, title, body);
    logger.log(`✅ Sent push notification with title '${title}' to user ${uuid}`);
  }

  /**
    * Sends an enrollment email to the user.
    *
    * @param user         - The user's information.
    * @param toName       - The name of the user.
    * @param courseName   - The name of the course the user is enrolling.
    * @param studentEmail - The email of the user.
    * @param topic        - The kind of notification they will receive.
    */
  async sendEnrollmentEmail(user: any, toName: string, courseName: string, studentEmail: string, topic: string) {
    this.validateUserConfig(user, topic);
    await this.mail.sendEnrollmentEmail(toName, courseName, studentEmail);
  }

  /**
    * Sends an enrollment email to the user.
    *
    * @param user          - The user's information.
    * @param toName        - The name of the user.
    * @param professorName - The name of the professor in charge of the course.
    * @param courseName    - The name of the course the user is enrolling.
    * @param studentEmail  - The email of the user.
    * @param topic         - The kind of notification they will receive.
    */
  async sendAssistantAssignmentEmail(user: any, toName: string, professorName: string, courseName: string, studentEmail: string, topic: string) {
    this.validateUserConfig(user, topic);
    await this.mail.sendAssistantAssignmentEmail(toName, professorName, courseName, studentEmail);
  }

  /**
    * Sends rule modification emails to users.
    *
    * @param users - A list of users to send the emails.
    * @param rules - A list of the new rules the admins have selected.
    */
  async sendNewRulesEmails(users: any[], rules: any[]) {
    for (let i = 0; i < users.length; i++) {
      const uuid = users[i].uuid
      await this.mail.sendNewRulesEmail(uuid, rules);
    }
  }
}

const logger = new Logger(NotificationService.name);
