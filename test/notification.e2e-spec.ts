import { HttpException, HttpStatus } from '@nestjs/common';
import { NotificationService } from '../src/services/notification.service';
import { PushService } from '../src/services/push.service';
import { EmailService } from '../src/services/email.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let pushService: jest.Mocked<PushService>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser = {
    uuid: 'user-123',
    pushToken: 'ExponentPushToken[abc123]',
    pushTaskAssignment: true,
    pushMessageReceived: true,
    pushDeadlineReminder: true,
    emailEnrollment: true,
    emailAssistantAssignment: true,
  };

  beforeEach(() => {
    pushService = {
      notifyUser: jest.fn(),
    } as any;

    emailService = {
      sendEnrollmentEmail: jest.fn(),
      sendAssistantAssignmentEmail: jest.fn(),
    } as any;

    service = new NotificationService(pushService, emailService);
  });

  describe('validateUserConfig', () => {
    it('should throw if topic is silenced in config', () => {
      const user = { ...mockUser, pushTaskAssignment: false };
      expect(() =>
        service.validateUserConfig(user, 'task-assignment'),
      ).toThrow(new HttpException('user has task assignment silenced', HttpStatus.OK));
    });

    it('should not throw if topic is allowed in config', () => {
      expect(() =>
        service.validateUserConfig(mockUser, 'message-received'),
      ).not.toThrow();
    });
  });

  describe('notifyUser', () => {
    it('should call push.notifyUser with correct params', async () => {
      await service.notifyUser(mockUser, 'Hello', 'This is a message', 'task-assignment');
      expect(pushService.notifyUser).toHaveBeenCalledWith(
        mockUser.pushToken,
        'Hello',
        'This is a message',
      );
    });

    it('should throw if pushToken is missing', async () => {
      const user = { ...mockUser, pushToken: null };
      await expect(
        service.notifyUser(user, 'Title', 'Body', 'task-assignment'),
      ).rejects.toThrow(new HttpException('Received invalid data from users service', HttpStatus.INTERNAL_SERVER_ERROR));
    });

    it('should throw if topic is disabled', async () => {
      const user = { ...mockUser, pushDeadlineReminder: false };
      await expect(
        service.notifyUser(user, 'Reminder', 'Deadline soon', 'deadline-reminder'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('sendEnrollmentEmail', () => {
    it('should send email if allowed in config', async () => {
      await service.sendEnrollmentEmail(mockUser, 'Alice', 'Math 101', 'alice@example.com', 'enrollment');
      expect(emailService.sendEnrollmentEmail).toHaveBeenCalledWith('Alice', 'Math 101', 'alice@example.com');
    });

    it('should throw if enrollment email is silenced', async () => {
      const user = { ...mockUser, emailEnrollment: false };
      await expect(
        service.sendEnrollmentEmail(user, 'Alice', 'Math 101', 'alice@example.com', 'enrollment'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('sendAssistantAssignmentEmail', () => {
    it('should send email if allowed in config', async () => {
      await service.sendAssistantAssignmentEmail(mockUser, 'Bob', 'Prof. John', 'History 101', 'bob@example.com', 'assistant-assignment');
      expect(emailService.sendAssistantAssignmentEmail).toHaveBeenCalledWith(
        'Bob',
        'Prof. John',
        'History 101',
        'bob@example.com',
      );
    });

    it('should throw if assistant assignment email is silenced', async () => {
      const user = { ...mockUser, emailAssistantAssignment: false };
      await expect(
        service.sendAssistantAssignmentEmail(user, 'Bob', 'Prof. John', 'History 101', 'bob@example.com', 'assistant-assignment'),
      ).rejects.toThrow(HttpException);
    });
  });
});

