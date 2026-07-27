import { Test, TestingModule } from '@nestjs/testing';
import { FlowersController } from './flowers.controller';

describe('FlowersController', () => {
  let controller: FlowersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlowersController],
    }).compile();

    controller = module.get<FlowersController>(FlowersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
