import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShipmentEntity } from './entities/shipment.entity';
import { ShipmentRulesService } from './shipment-rules.service';
import { ShipmentStatus } from './shipment-status.enum';
import { ShipmentsService } from './shipments.service';

describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const repositoryMock = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const shipmentRulesServiceMock = {
    ensureCanBeDispatched: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        {
          provide: getRepositoryToken(ShipmentEntity),
          useValue: repositoryMock,
        },
        {
          provide: ShipmentRulesService,
          useValue: shipmentRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ShipmentsService);
  });

  it('is defined', () => {
    // Assert
    expect(service).toBeDefined();
  });
});