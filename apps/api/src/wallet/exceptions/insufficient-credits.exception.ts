import { HttpException, HttpStatus } from '@nestjs/common';

export class InsufficientCreditsException extends HttpException {
  constructor(required: number, available: number) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message: 'Insufficient credits',
        error: 'PaymentRequired',
        details: { required, available },
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
