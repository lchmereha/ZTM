import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const VALID_KEY_LENGTHS = [64, 96, 128];

@ValidatorConstraint({ name: 'isValidKeyLength', async: false })
export class IsValidKeyLengthConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string') return false;
    return VALID_KEY_LENGTHS.includes(value.length);
  }

  defaultMessage(): string {
    return `O tamanho da chave deve ser ${VALID_KEY_LENGTHS.join(', ')} caracteres (256, 384 ou 512 bits)`;
  }
}

export function IsValidKeyLength(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidKeyLengthConstraint,
    });
  };
}
