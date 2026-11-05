import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CriarCorridaDto {
    @IsString() @IsNotEmpty() @MaxLength(255) origem!: string;
    @IsString() @IsNotEmpty() @MaxLength(255) destino!: string;
}