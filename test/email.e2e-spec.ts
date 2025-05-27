import { EmailService } from '../src/services/email.service';
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

  describe('sendEnrollmentEmail', () => {
    it('should call emailjs.send with correct parameters', async () => {
      const mockResponse = { status: 200 };
      (emailjs.send as jest.Mock).mockResolvedValue(mockResponse);

      await service.sendEnrollmentEmail('Alice', 'Math 101', 'alice@example.com');

      expect(emailjs.send).toHaveBeenCalledWith(
        'service_7c9h1g8',
        'template_warjsk8',
        {
          to_name: 'Alice',
          course_name: 'Math 101',
          student_email: 'alice@example.com',
        },
        expect.objectContaining({
          privateKey: process.env.EMAIL_PRIVATE_KEY,
          publicKey: 'hKz0YVFI0a8LaRhc7',
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
        'service_7c9h1g8',
        'template_tnztalm',
        {
          to_name: 'Bob',
          professor_name: 'Prof. Smith',
          course_name: 'CS101',
          student_email: 'bob@example.com',
        },
        expect.objectContaining({
          privateKey: process.env.EMAIL_PRIVATE_KEY,
          publicKey: 'hKz0YVFI0a8LaRhc7',
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

