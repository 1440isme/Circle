import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Inject,
  Optional,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ZodSchema } from 'zod';
import { Locale, resolveLocale, getFirstZodError } from '@circle/shared';

export type SchemaFactory = (locale: Locale) => ZodSchema;

@Injectable({ scope: Scope.REQUEST })
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private readonly schemaOrFactory: ZodSchema | SchemaFactory,
    @Optional() @Inject(REQUEST) private readonly request?: Request,
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    // Only validate request body; skip custom decorators like @CurrentUser() or route params
    if (metadata.type !== 'body') {
      return value;
    }

    let schema: ZodSchema;

    if (typeof this.schemaOrFactory === 'function') {
      const circleLocale = this.request?.headers?.['x-circle-locale'] as string | undefined;
      const acceptLanguage = this.request?.headers?.['accept-language'] as string | undefined;
      const locale = resolveLocale(circleLocale, acceptLanguage);
      schema = (this.schemaOrFactory as SchemaFactory)(locale);
    } else {
      schema = this.schemaOrFactory;
    }

    const result = schema.safeParse(value);
    if (!result.success) {
      const firstMessage = getFirstZodError(result.error) || 'Validation failed';
      throw new BadRequestException({
        message: firstMessage,
        errors: result.error.flatten().fieldErrors,
      });
    }

    return result.data;
  }
}
