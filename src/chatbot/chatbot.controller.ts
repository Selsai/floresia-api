import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  sendMessage(@Body() dto: SendMessageDto, @Req() req: Request) {
    const ip = req.ip || 'unknown';
    return this.chatbotService.sendMessage(dto, ip);
  }
}
