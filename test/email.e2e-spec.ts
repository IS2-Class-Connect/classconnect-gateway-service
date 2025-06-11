import { EmailService, TEMPLATE_EMAIL_ID, PUBLIC_KEY, SERVICE_ID, KEYS } from '../src/services/email.service';
import { HttpException } from '@nestjs/common';
import emailjs from '@emailjs/nodejs';

jest.mock('@emailjs/nodejs', () => ({
  send: jest.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    service = new EmailService();
    jest.clearAllMocks(); // clear mocks between tests
  });

  describe('sendNewRulesEmail', () => {
    const rules = [{
      title: 'title',
      description: 'description',
      effective_date: '2025-05-05',
      applicable_conditions: ["condition 1", "condition 2"]
    }];

    it('should call emailjs.send with correct parameters', async () => {
      const mockResponse = { status: 200 };
      (emailjs.send as jest.Mock).mockResolvedValue(mockResponse);

      await service.sendNewRulesEmail('Thomas', 'thomas@example.com', rules)

      expect(emailjs.send).toHaveBeenCalledWith(
        SERVICE_ID,
        TEMPLATE_EMAIL_ID,
        {
          toName: 'Thomas',
          toEmail: 'thomas@example.com',
          subject: 'New Rules and Policies',
          body: service.newRulesTemplate(rules)
        },
        expect.objectContaining({
          privateKey: process.env.EMAIL_PRIVATE_KEY,
          publicKey: PUBLIC_KEY,
        })
      );
    });

    it('should throw HttpException if emailjs.send fails', async () => {
      (emailjs.send as jest.Mock).mockRejectedValue(new Error('Failed'));

      await expect(
        service.sendNewRulesEmail('Alice', 'alice@example.com', rules)
      ).rejects.toThrow(HttpException);
    });
  });

  describe('sendEnrollmentEmail', () => {
    it('should call emailjs.send with correct parameters', async () => {
      const mockResponse = { status: 200 };
      (emailjs.send as jest.Mock).mockResolvedValue(mockResponse);

      await service.sendEnrollmentEmail('Alice', 'Math 101', 'alice@example.com');

      expect(emailjs.send).toHaveBeenCalledWith(
        SERVICE_ID,
        TEMPLATE_EMAIL_ID,
        {
          toName: 'Alice',
          toEmail: 'alice@example.com',
          subject: 'Enrollment Confirmation - Math 101',
          body: service.enrollmentTemplate('Math 101'),
        },
        expect.objectContaining({
          privateKey: process.env.EMAIL_PRIVATE_KEY,
          publicKey: PUBLIC_KEY,
        })
      );
    });

    it('should throw HttpException if emailjs.send fails', async () => {
      (emailjs.send as jest.Mock).mockRejectedValue(new Error('Failed'));

      await expect(
        service.sendEnrollmentEmail('Alice', 'Math 101', 'alice@example.com')
      ).rejects.toThrow(HttpException);
    });
  });

  describe('sendAssistantAssignmentEmail', () => {
    it('should call emailjs.send with correct parameters', async () => {
      const mockResponse = { status: 200 };
      (emailjs.send as jest.Mock).mockResolvedValue(mockResponse);

      await service.sendAssistantAssignmentEmail(
        'Bob',
        'Prof. Smith',
        'CS101',
        'bob@example.com'
      );

      expect(emailjs.send).toHaveBeenCalledWith(
        SERVICE_ID,
        TEMPLATE_EMAIL_ID,
        {
          toName: 'Bob',
          toEmail: 'bob@example.com',
          subject: 'Assistant Assignment - CS101',
          body: service.assistantAssignmentTemplate('CS101', 'Prof. Smith')
        },
        expect.objectContaining({
          privateKey: process.env.EMAIL_PRIVATE_KEY,
          publicKey: PUBLIC_KEY,
        })
      );
    });

    it('should throw HttpException if emailjs.send fails', async () => {
      (emailjs.send as jest.Mock).mockRejectedValue(new Error('Failed'));

      await expect(
        service.sendAssistantAssignmentEmail(
          'Bob',
          'Prof. Smith',
          'CS101',
          'bob@example.com'
        )
      ).rejects.toThrow(HttpException);
    });
  });
});

