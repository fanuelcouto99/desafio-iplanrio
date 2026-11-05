import { IsIn } from "class-validator";

export class AlterarStatusDto {
    @IsIn(['ACEITA', 'EM_ANDAMENTO', 'FINALIZADA']) status!: 'ACEITA' | 'EM_ANDAMENTO' | 'FINALIZADA';
};