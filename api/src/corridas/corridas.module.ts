import { Module } from "@nestjs/common";
import { CorridasController } from "./corridas.controller";
import { CorridasService } from "./corridas.service";
import { MessagingModule } from "../messaging/messaging.modules";

@Module({
    controllers: [CorridasController],
    providers: [CorridasService],
    imports: [MessagingModule],
}) export class CorridasModule {}