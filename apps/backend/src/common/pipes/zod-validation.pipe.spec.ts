import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from './zod-validation.pipe';
import { createAuthSchemas } from '@circle/shared';

describe('ZodValidationPipe — Bilingual Validation & Error Handling', () => {
  it('should pass validation with valid login data', () => {
    const pipe = new ZodValidationPipe((locale) => createAuthSchemas(locale).loginSchema);
    const validData = {
      email: 'user@example.com',
      password: 'password123',
    };

    const result = pipe.transform(validData, { type: 'body' }) as any;
    expect(result.email).toBe('user@example.com');
    expect(result.password).toBe('password123');
  });

  it('should return Vietnamese error message by default when validation fails', () => {
    const pipe = new ZodValidationPipe((locale) => createAuthSchemas(locale).loginSchema);
    const invalidData = {
      email: '',
      password: '',
    };

    expect(() => pipe.transform(invalidData, { type: 'body' })).toThrow(BadRequestException);
    try {
      pipe.transform(invalidData, { type: 'body' });
    } catch (err: any) {
      const response = err.getResponse();
      expect(response.message).toBe('Email không được để trống');
    }
  });

  it('should return English error message when x-circle-locale is en', () => {
    const mockRequest = {
      headers: {
        'x-circle-locale': 'en',
      },
    } as any;

    const pipe = new ZodValidationPipe(
      (locale) => createAuthSchemas(locale).loginSchema,
      mockRequest,
    );
    const invalidData = {
      email: '',
      password: '',
    };

    expect(() => pipe.transform(invalidData, { type: 'body' })).toThrow(BadRequestException);
    try {
      pipe.transform(invalidData, { type: 'body' });
    } catch (err: any) {
      const response = err.getResponse();
      expect(response.message).toBe('Email is required');
    }
  });

  it('should return English error message when accept-language starts with en', () => {
    const mockRequest = {
      headers: {
        'accept-language': 'en-US,en;q=0.9',
      },
    } as any;

    const pipe = new ZodValidationPipe(
      (locale) => createAuthSchemas(locale).loginSchema,
      mockRequest,
    );
    const invalidData = {
      email: 'invalid-email',
      password: '123',
    };

    expect(() => pipe.transform(invalidData, { type: 'body' })).toThrow(BadRequestException);
    try {
      pipe.transform(invalidData, { type: 'body' });
    } catch (err: any) {
      const response = err.getResponse();
      expect(response.message).toBe('Please enter a valid email address');
    }
  });
});
