import { Module } from "@nestjs/common";
import { EventosService } from "./eventos.service";

@Module({
  providers: [EventosService],
  exports: [EventosService],
})
export class MessagingModule {}