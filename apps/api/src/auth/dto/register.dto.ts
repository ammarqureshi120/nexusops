import { Transform, type TransformFnParams } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @Transform(({ value }: TransformFnParams) => {
    const input: unknown = value;
    return typeof input === "string" ? input.trim().toLowerCase() : input;
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @Transform(({ value }: TransformFnParams) => {
    const input: unknown = value;
    return typeof input === "string" ? input.trim() : input;
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}
