import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class CreateUsersDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  role!: string;
}
