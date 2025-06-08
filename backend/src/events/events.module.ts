import { Module } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { EventBusService } from './event-bus.service';
import { EventReplayService } from './event-replay.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    EventStoreService,
    EventBusService, 
    EventReplayService,
  ],
  exports: [
    EventStoreService,
    EventBusService,
    EventReplayService,
  ],
})
export class EventsModule {}